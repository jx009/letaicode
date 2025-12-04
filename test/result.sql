-- 1. 目标商品 (FX 选品池)
WITH target_goods AS (
    SELECT DISTINCT
        CAST(goods_id AS BIGINT) AS goods_id
    FROM hive_vipvde.ads_gce_theme_condition_goods_dt -- gce货池表
    WHERE dt = '${dt}'
    AND fx_id IN ('112695', '112696', '112697')
),

-- 2. 商品信息 (一级类目 & 售龄)
goods_info AS (
    SELECT
        merchandise_no AS goods_id,
        first_cate_id,
        product_sell_age
    FROM viprpdm.dm_prd_normal_merchandise_info -- 商品信息表
    WHERE dt = '${dt}'
),

-- 3. 年轻用户与 Cookie 映射
youth_users AS (
    SELECT DISTINCT user_id
    FROM hive_vipudp.ads_user_platform_eleven_strategy_tag -- 十一大人群
    WHERE dt = '${dt}'
    AND user_type BETWEEN 2 AND 5
),
cookie_mapping AS (
    SELECT DISTINCT mid AS cookie_id, user_id
    FROM vipdw.dw_log_app_pageview_ds1 -- app pageview
    WHERE dt = '${dt}'
    AND mid IS NOT NULL AND mid <> ''
    AND user_id IS NOT NULL AND user_id <> ''
),
youth_cookies AS (
    SELECT DISTINCT cm.cookie_id
    FROM cookie_mapping cm
    JOIN youth_users yu ON cm.user_id = yu.user_id
),

-- 4. 原始行为数据 (曝光 & 销量) - 搜索场景, 年轻用户, 近 14 天
--    粒度: dt, goods_id, mid, query
base_data AS (
    -- 曝光
    SELECT
        a.dt,
        CAST(a.goods_id AS BIGINT) AS goods_id,
        a.cookie_id AS mid,
        a.content_module AS query,
        1 AS is_expose,
        0 AS sale_num
    FROM vipst_mobile.ads_app_goods_action_buss a -- 商品在各个卖场内曝光、点击、加购、收藏、成交的业务过程
    JOIN youth_cookies yc ON a.cookie_id = yc.cookie_id
    WHERE a.dt BETWEEN DATE_FORMAT(DATE_SUB(TO_DATE('${dt}', 'yyyyMMdd'), 13), 'yyyyMMdd') AND '${dt}'
    AND a.scene_id = '100001'
    AND a.action_type = 'expose'
    
    UNION ALL
    
    -- 销量
    SELECT
        a.dt,
        CAST(a.goods_id AS BIGINT) AS goods_id,
        a.cookie_id AS mid,
        a.content_module AS query,
        0 AS is_expose,
        b.goods_acture_num AS sale_num
    FROM (
        SELECT DISTINCT dt, scene_id, content_module, cookie_id, order_id, goods_id
        FROM vipst_mobile.ads_app_goods_action_buss -- 商品在各个卖场内曝光、点击、加购、收藏、成交的业务过程
        WHERE dt BETWEEN DATE_FORMAT(DATE_SUB(TO_DATE('${dt}', 'yyyyMMdd'), 13), 'yyyyMMdd') AND '${dt}'
        AND action_type = 'succ'
        AND scene_id = '100001'
    ) a
    JOIN (
        SELECT *, get_dt_date(add_time) AS order_dt
        FROM vipst_mobile.ads_app_sales_info -- app端订单商品销售
        WHERE dt BETWEEN DATE_FORMAT(DATE_SUB(TO_DATE('${dt}', 'yyyyMMdd'), 13), 'yyyyMMdd') AND '${dt}'
        AND get_dt_date(add_time) = dt
        AND dim_app_name = '特卖会' 
        AND dim_sec_source = 'app'
        AND order_quality = 1 
        AND gold_flag = 0 
        AND full_exchange_flag = 0
    ) b ON a.order_id = b.order_id AND a.goods_id = b.goods_id AND a.dt = b.order_dt
    JOIN youth_cookies yc ON a.cookie_id = yc.cookie_id
),

-- 5. 商品聚合统计 (14 天)
daily_grain_stats AS (
    SELECT
        goods_id,
        dt,
        mid,
        query,
        MAX(is_expose) AS is_expose_flag,
        SUM(sale_num) AS total_sale_num
    FROM base_data
    GROUP BY goods_id, dt, mid, query
),

goods_14d_stats AS (
    SELECT
        goods_id,
        SUM(is_expose_flag) AS pv_14d,
        SUM(total_sale_num) AS sales_14d
    FROM daily_grain_stats
    GROUP BY goods_id
),

-- 6. 类目统计 (年轻用户 & 搜索场景)
goods_with_cate AS (
    SELECT
        s.goods_id,
        s.pv_14d, -- 14日曝光 pv（搜索列表&年轻人）
        s.sales_14d, -- 14日销量（归因搜索且为年轻人，mid+goods_id去重后的销量）
        g.first_cate_id -- 一级类目
    FROM goods_14d_stats s
    JOIN goods_info g ON s.goods_id = g.goods_id
),

category_14d_stats AS (
    SELECT
        first_cate_id,
        SUM(sales_14d) AS cat_sales_14d, -- 14日一级类目销量
        SUM(pv_14d) AS cat_pv_14d, -- 14日一级类目曝光 pv
        CASE 
            WHEN SUM(pv_14d) > 0 THEN CAST(SUM(sales_14d) AS DOUBLE) / SUM(pv_14d)
            ELSE 0.0 
        END AS cat_conversion_rate -- 14日一级类目年轻人曝光转化率
    FROM goods_with_cate
    GROUP BY first_cate_id
),

-- 7. 最终计算逻辑
joined_data AS (
    SELECT
        t.goods_id,
        gi.product_sell_age,
        COALESCE(s.pv_14d, 0) AS pv_14d, -- 14日曝光 pv（搜索列表&年轻人）
        COALESCE(s.sales_14d, 0) AS sales_14d, -- 14日销量（归因搜索且为年轻人，mid+goods_id去重后的销量）
        CASE
            WHEN COALESCE(s.pv_14d, 0) > 0 THEN CAST(COALESCE(s.sales_14d, 0) AS DOUBLE) / s.pv_14d
            ELSE 0.0
        END AS goods_conversion_rate, -- 14日曝光pv转化率（成交量/曝光pv）
        COALESCE(c.cat_conversion_rate, 0.0) AS cat_conversion_rate -- 14日一级类目年轻人曝光转化率
    FROM target_goods t
    LEFT JOIN goods_info gi ON t.goods_id = gi.goods_id
    LEFT JOIN goods_14d_stats s ON t.goods_id = s.goods_id
    LEFT JOIN category_14d_stats c ON gi.first_cate_id = c.first_cate_id
)

INSERT OVERWRITE TABLE vipup.ads_search_exposure_suppression_goods PARTITION (dt = '${dt}')
SELECT
    goods_id,
    '曝光打压' AS tag_name
FROM joined_data
WHERE product_sell_age > 14
AND pv_14d >= 1000
AND goods_conversion_rate < cat_conversion_rate;