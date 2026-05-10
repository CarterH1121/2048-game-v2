# 2048游戏专业统计后台系统完整方案

> 版本：v1.0  
> 日期：2026-04-29  
> 编制：策衡（Hermes团队协调官）

---

## 目录

1. [项目概述](#1-项目概述)
2. [数据库设计](#2-数据库设计)
3. [后台功能模块](#3-后台功能模块)
4. [技术架构](#4-技术架构)
5. [API设计](#5-api设计)
6. [团队分工](#6-团队分工)
7. [执行计划](#7-执行计划)
8. [风险评估](#8-风险评估)
9. [附录](#9-附录)

---

## 1. 项目概述

### 1.1 项目背景

2048游戏已成功上线运营，具备完整的游戏核心功能。为支撑后续运营发展、多平台扩展及商业化变现，需构建专业的统计后台管理系统。

### 1.2 现有系统状态

| 项目 | 状态 | 地址 |
|------|------|------|
| 游戏前端 | 已上线 | http://49.232.149.209:8080 |
| 后端API | 已上线 | http://49.232.149.209:3001 |
| 数据库 | MySQL Docker | 容器：mysql-2048 |
| 进程管理 | PM2 | Ubuntu服务器 |

### 1.3 现有数据表

```
├── users           # 用户基础信息
├── game_records    # 游戏记录
├── feedback        # 用户反馈
└── achievements    # 成就数据
```

### 1.4 现有游戏功能

**已实现功能：**
- 用户系统：命名、登录、数据同步
- 游戏模式：经典、挑战、限时、极限
- 道具系统：撤销、提示、洗牌、炸弹、升级、翻倍
- 排行榜：全球排行榜
- 任务系统：每日任务
- 赛季系统：赛季奖励
- 反馈系统：文字+图片反馈

**规划中功能：**
- 皮肤系统：皮肤商店、皮肤售卖、皮肤切换
- 道具商城：道具购买（内购）
- 成就系统完善：成就展示、奖励领取
- 好友系统：好友列表、好友对战
- 分享系统：分享战绩、邀请好友
- 广告系统：激励视频广告、插屏广告
- VIP系统：会员特权

### 1.5 目标平台扩展

| 平台 | 优先级 | 预计接入时间 |
|------|--------|--------------|
| 微信小程序 | P0 | 第2阶段 |
| 微信公众号 | P1 | 第2阶段 |
| 支付宝小程序 | P1 | 第3阶段 |
| 抖音小程序 | P2 | 第3阶段 |
| iOS App | P2 | 第4阶段 |
| Android App | P2 | 第4阶段 |

---

## 2. 数据库设计

### 2.1 数据库架构总览

```
2048_game_db
├── 用户域 (User Domain)
│   ├── users                    # 用户基础信息 [现有]
│   ├── user_profiles            # 用户详细资料
│   ├── user_settings            # 用户设置
│   ├── user_devices             # 设备绑定
│   └── user_sessions            # 登录会话
│
├── 游戏域 (Game Domain)
│   ├── game_records             # 游戏记录 [现有]
│   ├── game_modes               # 游戏模式配置
│   ├── daily_tasks              # 每日任务配置
│   ├── task_completions         # 任务完成记录
│   ├── seasons                  # 赛季配置
│   └── season_rewards           # 赛季奖励
│
├── 道具域 (Item Domain)
│   ├── items                    # 道具定义
│   ├── user_items               # 用户道具库存
│   ├── item_logs                # 道具使用日志
│   └── item_shop                # 道具商店配置
│
├── 皮肤域 (Skin Domain)
│   ├── skins                    # 皮肤定义
│   ├── user_skins               # 用户拥有皮肤
│   ├── skin_shop                # 皮肤商店配置
│   └── skin_transactions        # 皮肤交易记录
│
├── 成就域 (Achievement Domain)
│   ├── achievements             # 成就定义 [现有扩展]
│   ├── user_achievements        # 用户成就记录
│   └── achievement_rewards      # 成就奖励领取记录
│
├── 社交域 (Social Domain)
│   ├── friends                  # 好友关系
│   ├── friend_requests          # 好友请求
│   ├── shares                   # 分享记录
│   └── invitations              # 邀请记录
│
├── 交易域 (Commerce Domain)
│   ├── products                 # 商品定义
│   ├── orders                   # 订单
│   ├── payments                 # 支付记录
│   ├── refunds                  # 退款记录
│   └── transactions             # 交易流水
│
├── VIP域 (VIP Domain)
│   ├── vip_levels               # VIP等级定义
│   ├── user_vip                 # 用户VIP信息
│   └── vip_benefits             # VIP权益配置
│
├── 广告域 (Ad Domain)
│   ├── ad_configs               # 广告配置
│   ├── ad_impressions           # 广告展示记录
│   └── ad_rewards               # 激励广告奖励
│
├── 反馈域 (Feedback Domain)
│   ├── feedback                 # 用户反馈 [现有]
│   └── feedback_replies         # 反馈回复
│
├── 后台管理域 (Admin Domain)
│   ├── admins                   # 管理员账户
│   ├── roles                    # 角色定义
│   ├── permissions              # 权限定义
│   ├── role_permissions         # 角色-权限关联
│   ├── admin_logs               # 操作日志
│   └── system_configs           # 系统配置
│
├── 平台对接域 (Platform Domain)
│   ├── platform_users           # 平台用户映射
│   ├── wechat_configs           # 微信配置
│   ├── alipay_configs           # 支付宝配置
│   └── douyin_configs           # 抖音配置
│
└── 统计域 (Analytics Domain)
    ├── daily_statistics         # 每日统计
    ├── realtime_metrics         # 实时指标
    ├── retention_stats          # 留存统计
    └── revenue_stats            # 收入统计
```

### 2.2 详细表结构设计

#### 2.2.1 用户域表结构

```sql
-- 用户基础信息 [现有表扩展]
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL COMMENT '用户唯一标识',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar VARCHAR(255) COMMENT '头像URL',
    gender TINYINT DEFAULT 0 COMMENT '性别：0未知 1男 2女',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用 1正常 2封禁',
    vip_level INT DEFAULT 0 COMMENT 'VIP等级',
    total_games INT DEFAULT 0 COMMENT '总游戏局数',
    highest_score INT DEFAULT 0 COMMENT '历史最高分',
    total_score BIGINT DEFAULT 0 COMMENT '累计分数',
    coins INT DEFAULT 0 COMMENT '金币余额',
    diamonds INT DEFAULT 0 COMMENT '钻石余额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP COMMENT '最后登录时间',
    last_login_ip VARCHAR(45) COMMENT '最后登录IP',
    deleted_at TIMESTAMP NULL COMMENT '软删除时间',
    INDEX idx_uuid (uuid),
    INDEX idx_status (status),
    INDEX idx_vip_level (vip_level),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户基础信息';

-- 用户详细资料
CREATE TABLE user_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE NOT NULL,
    real_name VARCHAR(50) COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    birthday DATE COMMENT '生日',
    province VARCHAR(50) COMMENT '省份',
    city VARCHAR(50) COMMENT '城市',
    language VARCHAR(20) DEFAULT 'zh-CN' COMMENT '语言',
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai' COMMENT '时区',
    bio TEXT COMMENT '个人简介',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户详细资料';

-- 用户设置
CREATE TABLE user_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE NOT NULL,
    sound_enabled TINYINT DEFAULT 1 COMMENT '音效开关',
    music_enabled TINYINT DEFAULT 1 COMMENT '音乐开关',
    vibration_enabled TINYINT DEFAULT 1 COMMENT '震动开关',
    notification_enabled TINYINT DEFAULT 1 COMMENT '通知开关',
    language VARCHAR(20) DEFAULT 'zh-CN' COMMENT '界面语言',
    theme VARCHAR(20) DEFAULT 'default' COMMENT '主题',
    skin_id INT DEFAULT 1 COMMENT '当前使用皮肤',
    privacy_settings JSON COMMENT '隐私设置',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户设置';

-- 设备绑定
CREATE TABLE user_devices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    device_id VARCHAR(100) NOT NULL COMMENT '设备ID',
    device_type VARCHAR(20) COMMENT '设备类型：web/ios/android',
    device_name VARCHAR(100) COMMENT '设备名称',
    os_version VARCHAR(50) COMMENT '系统版本',
    app_version VARCHAR(20) COMMENT '应用版本',
    push_token VARCHAR(255) COMMENT '推送Token',
    is_primary TINYINT DEFAULT 0 COMMENT '是否主设备',
    last_active_at TIMESTAMP COMMENT '最后活跃时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_device (user_id, device_id),
    INDEX idx_device_id (device_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备绑定';

-- 登录会话
CREATE TABLE user_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL COMMENT '会话Token',
    refresh_token VARCHAR(255) COMMENT '刷新Token',
    device_id VARCHAR(100) COMMENT '设备ID',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT 'User-Agent',
    platform VARCHAR(20) COMMENT '平台：web/wechat/alipay/douyin',
    expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='登录会话';
```

#### 2.2.2 游戏域表结构

```sql
-- 游戏记录 [现有表扩展]
CREATE TABLE game_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    game_mode VARCHAR(20) NOT NULL COMMENT '游戏模式',
    score INT NOT NULL COMMENT '得分',
    max_tile INT COMMENT '最大方块',
    moves INT COMMENT '移动次数',
    time_spent INT COMMENT '游戏时长(秒)',
    items_used JSON COMMENT '使用的道具',
    is_victory TINYINT DEFAULT 0 COMMENT '是否胜利',
    session_id VARCHAR(36) COMMENT '会话ID',
    platform VARCHAR(20) DEFAULT 'web' COMMENT '平台',
    version VARCHAR(20) COMMENT '版本',
    extra_data JSON COMMENT '扩展数据',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_game_mode (game_mode),
    INDEX idx_score (score),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏记录';

-- 游戏模式配置
CREATE TABLE game_modes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL COMMENT '模式代码',
    name VARCHAR(50) NOT NULL COMMENT '模式名称',
    description TEXT COMMENT '模式描述',
    icon VARCHAR(255) COMMENT '图标',
    rules JSON COMMENT '游戏规则配置',
    rewards JSON COMMENT '奖励配置',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用 1启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏模式配置';

-- 每日任务配置
CREATE TABLE daily_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '任务代码',
    name VARCHAR(100) NOT NULL COMMENT '任务名称',
    description TEXT COMMENT '任务描述',
    type VARCHAR(20) NOT NULL COMMENT '任务类型',
    target INT NOT NULL COMMENT '目标数量',
    reward_coins INT DEFAULT 0 COMMENT '金币奖励',
    reward_diamonds INT DEFAULT 0 COMMENT '钻石奖励',
    reward_items JSON COMMENT '道具奖励',
    icon VARCHAR(255) COMMENT '图标',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日任务配置';

-- 任务完成记录
CREATE TABLE task_completions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    task_id INT NOT NULL,
    progress INT DEFAULT 0 COMMENT '进度',
    is_completed TINYINT DEFAULT 0 COMMENT '是否完成',
    is_claimed TINYINT DEFAULT 0 COMMENT '是否领取奖励',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    claimed_at TIMESTAMP NULL COMMENT '领取时间',
    date DATE NOT NULL COMMENT '日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_task_date (user_id, task_id, date),
    INDEX idx_user_id (user_id),
    INDEX idx_date (date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES daily_tasks(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务完成记录';

-- 赛季配置
CREATE TABLE seasons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL COMMENT '赛季代码',
    name VARCHAR(100) NOT NULL COMMENT '赛季名称',
    description TEXT COMMENT '赛季描述',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE NOT NULL COMMENT '结束日期',
    rewards JSON COMMENT '赛季奖励配置',
    rules JSON COMMENT '赛季规则',
    icon VARCHAR(255) COMMENT '图标',
    banner VARCHAR(255) COMMENT '横幅图片',
    status TINYINT DEFAULT 1 COMMENT '状态：0未开始 1进行中 2已结束',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='赛季配置';

-- 赛季奖励领取
CREATE TABLE season_rewards (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    season_id INT NOT NULL,
    rank INT COMMENT '最终排名',
    rewards JSON COMMENT '获得奖励',
    is_claimed TINYINT DEFAULT 0 COMMENT '是否领取',
    claimed_at TIMESTAMP NULL COMMENT '领取时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_season (user_id, season_id),
    INDEX idx_season_id (season_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (season_id) REFERENCES seasons(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='赛季奖励领取';
```

#### 2.2.3 道具域表结构

```sql
-- 道具定义
CREATE TABLE items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(30) UNIQUE NOT NULL COMMENT '道具代码',
    name VARCHAR(50) NOT NULL COMMENT '道具名称',
    description TEXT COMMENT '道具描述',
    type VARCHAR(20) NOT NULL COMMENT '道具类型',
    icon VARCHAR(255) COMMENT '图标',
    effect JSON COMMENT '效果配置',
    price_coins INT DEFAULT 0 COMMENT '金币价格',
    price_diamonds INT DEFAULT 0 COMMENT '钻石价格',
    max_count INT DEFAULT 99 COMMENT '最大持有数量',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='道具定义';

-- 用户道具库存
CREATE TABLE user_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    item_id INT NOT NULL,
    count INT DEFAULT 0 COMMENT '数量',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_item (user_id, item_id),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户道具库存';

-- 道具使用日志
CREATE TABLE item_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    item_id INT NOT NULL,
    action VARCHAR(20) NOT NULL COMMENT '操作：use/obtain/purchase/gift',
    count INT NOT NULL COMMENT '数量(正数获得，负数消耗)',
    balance_after INT COMMENT '操作后余额',
    source VARCHAR(50) COMMENT '来源',
    game_record_id BIGINT COMMENT '关联游戏记录',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_item_id (item_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='道具使用日志';

-- 道具商店配置
CREATE TABLE item_shop (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    shop_category VARCHAR(20) COMMENT '商店分类',
    discount DECIMAL(5,2) DEFAULT 100 COMMENT '折扣(%)',
    limit_type VARCHAR(20) COMMENT '限购类型：daily/weekly/monthly/forever',
    limit_count INT COMMENT '限购数量',
    start_time TIMESTAMP COMMENT '上架开始时间',
    end_time TIMESTAMP COMMENT '上架结束时间',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_item_shop (item_id, shop_category),
    FOREIGN KEY (item_id) REFERENCES items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='道具商店配置';
```

#### 2.2.4 皮肤域表结构

```sql
-- 皮肤定义
CREATE TABLE skins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(30) UNIQUE NOT NULL COMMENT '皮肤代码',
    name VARCHAR(50) NOT NULL COMMENT '皮肤名称',
    description TEXT COMMENT '皮肤描述',
    category VARCHAR(20) NOT NULL COMMENT '分类：classic/seasonal/vip/limited',
    preview_image VARCHAR(255) COMMENT '预览图',
    config JSON COMMENT '皮肤配置(颜色、样式等)',
    price_coins INT DEFAULT 0 COMMENT '金币价格',
    price_diamonds INT DEFAULT 0 COMMENT '钻石价格',
    price_rmb DECIMAL(10,2) COMMENT '人民币价格',
    rarity VARCHAR(20) DEFAULT 'common' COMMENT '稀有度：common/rare/epic/legendary',
    is_default TINYINT DEFAULT 0 COMMENT '是否默认皮肤',
    is_limited TINYINT DEFAULT 0 COMMENT '是否限量',
    limited_count INT COMMENT '限量数量',
    sold_count INT DEFAULT 0 COMMENT '已售数量',
    start_time TIMESTAMP COMMENT '上架开始时间',
    end_time TIMESTAMP COMMENT '上架结束时间',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='皮肤定义';

-- 用户拥有皮肤
CREATE TABLE user_skins (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    skin_id INT NOT NULL,
    obtain_type VARCHAR(20) COMMENT '获取方式：purchase/gift/reward/vip',
    purchase_price DECIMAL(10,2) COMMENT '购买价格',
    is_active TINYINT DEFAULT 0 COMMENT '是否使用中',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_skin (user_id, skin_id),
    INDEX idx_user_id (user_id),
    INDEX idx_skin_id (skin_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skin_id) REFERENCES skins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户拥有皮肤';

-- 皮肤交易记录
CREATE TABLE skin_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    skin_id INT NOT NULL,
    action VARCHAR(20) NOT NULL COMMENT '操作：purchase/gift/reward/activate',
    price_type VARCHAR(20) COMMENT '支付类型：coins/diamonds/rmb/free',
    price_amount DECIMAL(10,2) COMMENT '支付金额',
    order_id VARCHAR(50) COMMENT '关联订单号',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_skin_id (skin_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skin_id) REFERENCES skins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='皮肤交易记录';
```

#### 2.2.5 成就域表结构

```sql
-- 成就定义
CREATE TABLE achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '成就代码',
    name VARCHAR(100) NOT NULL COMMENT '成就名称',
    description TEXT COMMENT '成就描述',
    category VARCHAR(20) NOT NULL COMMENT '分类：game/social/collection/special',
    type VARCHAR(20) NOT NULL COMMENT '类型：score/games/invite/etc',
    target INT NOT NULL COMMENT '目标数值',
    points INT DEFAULT 0 COMMENT '成就点数',
    reward_coins INT DEFAULT 0 COMMENT '金币奖励',
    reward_diamonds INT DEFAULT 0 COMMENT '钻石奖励',
    reward_items JSON COMMENT '道具奖励',
    reward_skin_id INT COMMENT '奖励皮肤',
    icon VARCHAR(255) COMMENT '图标',
    badge VARCHAR(255) COMMENT '徽章图片',
    rarity VARCHAR(20) DEFAULT 'common' COMMENT '稀有度',
    is_hidden TINYINT DEFAULT 0 COMMENT '是否隐藏成就',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成就定义';

-- 用户成就记录
CREATE TABLE user_achievements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    achievement_id INT NOT NULL,
    progress INT DEFAULT 0 COMMENT '进度',
    is_unlocked TINYINT DEFAULT 0 COMMENT '是否解锁',
    is_claimed TINYINT DEFAULT 0 COMMENT '是否领取奖励',
    unlocked_at TIMESTAMP NULL COMMENT '解锁时间',
    claimed_at TIMESTAMP NULL COMMENT '领取时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_achievement (user_id, achievement_id),
    INDEX idx_user_id (user_id),
    INDEX idx_achievement_id (achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户成就记录';
```

#### 2.2.6 社交域表结构

```sql
-- 好友关系
CREATE TABLE friends (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    friend_id BIGINT NOT NULL,
    status TINYINT DEFAULT 1 COMMENT '状态：0删除 1正常',
    intimacy INT DEFAULT 0 COMMENT '亲密度',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_friend (user_id, friend_id),
    INDEX idx_user_id (user_id),
    INDEX idx_friend_id (friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='好友关系';

-- 好友请求
CREATE TABLE friend_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    from_user_id BIGINT NOT NULL,
    to_user_id BIGINT NOT NULL,
    message VARCHAR(200) COMMENT '请求消息',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending/accepted/rejected/expired',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_from_user (from_user_id),
    INDEX idx_to_user (to_user_id),
    INDEX idx_status (status),
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='好友请求';

-- 分享记录
CREATE TABLE shares (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    share_type VARCHAR(20) NOT NULL COMMENT '分享类型：score/achievement/invite',
    share_platform VARCHAR(20) NOT NULL COMMENT '分享平台：wechat/friends/qq/weibo',
    share_content JSON COMMENT '分享内容',
    reward_claimed TINYINT DEFAULT 0 COMMENT '是否领取奖励',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_share_type (share_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分享记录';

-- 邀请记录
CREATE TABLE invitations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    inviter_id BIGINT NOT NULL COMMENT '邀请人',
    invitee_id BIGINT COMMENT '被邀请人',
    invite_code VARCHAR(20) UNIQUE COMMENT '邀请码',
    invite_platform VARCHAR(20) COMMENT '邀请平台',
    reward_type VARCHAR(20) COMMENT '奖励类型',
    reward_amount INT COMMENT '奖励数量',
    is_rewarded TINYINT DEFAULT 0 COMMENT '是否发放奖励',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_inviter (inviter_id),
    INDEX idx_invite_code (invite_code),
    FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邀请记录';
```

#### 2.2.7 交易域表结构

```sql
-- 商品定义
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(30) UNIQUE NOT NULL COMMENT '商品代码',
    name VARCHAR(100) NOT NULL COMMENT '商品名称',
    description TEXT COMMENT '商品描述',
    category VARCHAR(20) NOT NULL COMMENT '分类：coins/diamonds/items/vip/skin',
    content JSON NOT NULL COMMENT '商品内容',
    original_price DECIMAL(10,2) COMMENT '原价',
    current_price DECIMAL(10,2) NOT NULL COMMENT '现价',
    currency VARCHAR(10) DEFAULT 'CNY' COMMENT '货币类型',
    icon VARCHAR(255) COMMENT '图标',
    is_hot TINYINT DEFAULT 0 COMMENT '是否热卖',
    is_new TINYINT DEFAULT 0 COMMENT '是否新品',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品定义';

-- 订单
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(50) UNIQUE NOT NULL COMMENT '订单号',
    user_id BIGINT NOT NULL,
    product_id INT NOT NULL,
    product_snapshot JSON COMMENT '商品快照',
    quantity INT DEFAULT 1 COMMENT '数量',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '订单金额',
    pay_amount DECIMAL(10,2) COMMENT '实付金额',
    discount_amount DECIMAL(10,2) DEFAULT 0 COMMENT '优惠金额',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending/paid/cancelled/refunded',
    pay_channel VARCHAR(20) COMMENT '支付渠道：wechat/alipay/apple/google',
    pay_time TIMESTAMP NULL COMMENT '支付时间',
    cancel_time TIMESTAMP NULL COMMENT '取消时间',
    refund_time TIMESTAMP NULL COMMENT '退款时间',
    expire_time TIMESTAMP COMMENT '过期时间',
    extra_data JSON COMMENT '扩展数据',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_no (order_no),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单';

-- 支付记录
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    payment_no VARCHAR(50) UNIQUE NOT NULL COMMENT '支付流水号',
    order_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    channel VARCHAR(20) NOT NULL COMMENT '支付渠道',
    channel_trade_no VARCHAR(100) COMMENT '渠道交易号',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending/success/failed',
    notify_data JSON COMMENT '回调数据',
    paid_at TIMESTAMP NULL COMMENT '支付成功时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_payment_no (payment_no),
    INDEX idx_order_id (order_id),
    INDEX idx_user_id (user_id),
    INDEX idx_channel_trade_no (channel_trade_no),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付记录';

-- 退款记录
CREATE TABLE refunds (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    refund_no VARCHAR(50) UNIQUE NOT NULL COMMENT '退款单号',
    order_id BIGINT NOT NULL,
    payment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL COMMENT '退款金额',
    reason VARCHAR(500) COMMENT '退款原因',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending/success/failed',
    channel_refund_no VARCHAR(100) COMMENT '渠道退款单号',
    refunded_at TIMESTAMP NULL COMMENT '退款成功时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_refund_no (refund_no),
    INDEX idx_order_id (order_id),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (payment_id) REFERENCES payments(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='退款记录';

-- 交易流水
CREATE TABLE transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_no VARCHAR(50) UNIQUE NOT NULL COMMENT '交易流水号',
    user_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL COMMENT '类型：recharge/consume/reward/refund/gift',
    sub_type VARCHAR(50) COMMENT '子类型',
    amount DECIMAL(10,2) NOT NULL COMMENT '金额(正负)',
    balance_before DECIMAL(10,2) COMMENT '变动前余额',
    balance_after DECIMAL(10,2) COMMENT '变动后余额',
    currency VARCHAR(10) DEFAULT 'CNY' COMMENT '货币类型',
    ref_type VARCHAR(20) COMMENT '关联类型：order/payment/reward',
    ref_id VARCHAR(50) COMMENT '关联ID',
    description VARCHAR(500) COMMENT '描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_transaction_no (transaction_no),
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='交易流水';
```

#### 2.2.8 VIP域表结构

```sql
-- VIP等级定义
CREATE TABLE vip_levels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    level INT UNIQUE NOT NULL COMMENT '等级',
    name VARCHAR(50) NOT NULL COMMENT '等级名称',
    icon VARCHAR(255) COMMENT '等级图标',
    badge VARCHAR(255) COMMENT '徽章图片',
    min_points INT NOT NULL COMMENT '升级所需经验',
    description TEXT COMMENT '等级描述',
    benefits JSON COMMENT '权益配置',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='VIP等级定义';

-- 用户VIP信息
CREATE TABLE user_vip (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE NOT NULL,
    level INT DEFAULT 0 COMMENT '当前等级',
    points INT DEFAULT 0 COMMENT '当前经验',
    total_recharged DECIMAL(10,2) DEFAULT 0 COMMENT '累计充值',
    expire_time TIMESTAMP COMMENT 'VIP过期时间',
    daily_benefits_claimed DATE COMMENT '每日权益领取日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_level (level),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户VIP信息';

-- VIP权益配置
CREATE TABLE vip_benefits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(30) UNIQUE NOT NULL COMMENT '权益代码',
    name VARCHAR(100) NOT NULL COMMENT '权益名称',
    description TEXT COMMENT '权益描述',
    type VARCHAR(20) NOT NULL COMMENT '类型：daily/permanent/unlock',
    content JSON NOT NULL COMMENT '权益内容',
    min_level INT DEFAULT 1 COMMENT '最低等级',
    icon VARCHAR(255) COMMENT '图标',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='VIP权益配置';
```

#### 2.2.9 广告域表结构

```sql
-- 广告配置
CREATE TABLE ad_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(30) UNIQUE NOT NULL COMMENT '广告位代码',
    name VARCHAR(100) NOT NULL COMMENT '广告位名称',
    type VARCHAR(20) NOT NULL COMMENT '类型：rewarded/interstitial/banner',
    placement VARCHAR(50) NOT NULL COMMENT '展示位置',
    ad_network VARCHAR(20) COMMENT '广告网络',
    ad_unit_id VARCHAR(100) COMMENT '广告单元ID',
    reward_type VARCHAR(20) COMMENT '奖励类型',
    reward_amount INT COMMENT '奖励数量',
    cooldown_seconds INT DEFAULT 0 COMMENT '冷却时间(秒)',
    daily_limit INT COMMENT '每日限制',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='广告配置';

-- 广告展示记录
CREATE TABLE ad_impressions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    ad_config_id INT NOT NULL,
    type VARCHAR(20) NOT NULL COMMENT '类型',
    action VARCHAR(20) NOT NULL COMMENT '动作：show/click/complete/close',
    reward_claimed TINYINT DEFAULT 0 COMMENT '是否领取奖励',
    platform VARCHAR(20) COMMENT '平台',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    device_id VARCHAR(100) COMMENT '设备ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_ad_config_id (ad_config_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ad_config_id) REFERENCES ad_configs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='广告展示记录';

-- 激励广告奖励
CREATE TABLE ad_rewards (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    ad_config_id INT NOT NULL,
    reward_type VARCHAR(20) NOT NULL COMMENT '奖励类型',
    reward_amount INT NOT NULL COMMENT '奖励数量',
    transaction_id BIGINT COMMENT '关联交易',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ad_config_id) REFERENCES ad_configs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='激励广告奖励';
```

#### 2.2.10 反馈域表结构

```sql
-- 用户反馈 [现有表扩展]
CREATE TABLE feedback (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT COMMENT '用户ID',
    type VARCHAR(20) NOT NULL COMMENT '类型：bug/suggestion/other',
    title VARCHAR(200) COMMENT '标题',
    content TEXT NOT NULL COMMENT '内容',
    images JSON COMMENT '图片列表',
    device_info JSON COMMENT '设备信息',
    app_version VARCHAR(20) COMMENT '应用版本',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending/processing/resolved/closed',
    priority INT DEFAULT 0 COMMENT '优先级',
    admin_id INT COMMENT '处理人',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户反馈';

-- 反馈回复
CREATE TABLE feedback_replies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    feedback_id BIGINT NOT NULL,
    admin_id INT COMMENT '回复管理员',
    user_id BIGINT COMMENT '用户追问',
    content TEXT NOT NULL COMMENT '回复内容',
    is_internal TINYINT DEFAULT 0 COMMENT '是否内部备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_feedback_id (feedback_id),
    FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='反馈回复';
```

#### 2.2.11 后台管理域表结构

```sql
-- 管理员账户
CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    name VARCHAR(50) COMMENT '姓名',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号',
    avatar VARCHAR(255) COMMENT '头像',
    role_id INT COMMENT '角色ID',
    department VARCHAR(50) COMMENT '部门',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用 1正常',
    last_login_at TIMESTAMP COMMENT '最后登录时间',
    last_login_ip VARCHAR(45) COMMENT '最后登录IP',
    login_attempts INT DEFAULT 0 COMMENT '登录尝试次数',
    locked_until TIMESTAMP COMMENT '锁定至',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员账户';

-- 角色定义
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(30) UNIQUE NOT NULL COMMENT '角色代码',
    name VARCHAR(50) NOT NULL COMMENT '角色名称',
    description TEXT COMMENT '角色描述',
    is_system TINYINT DEFAULT 0 COMMENT '是否系统角色',
    status TINYINT DEFAULT 1 COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色定义';

-- 权限定义
CREATE TABLE permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '权限代码',
    name VARCHAR(100) NOT NULL COMMENT '权限名称',
    group_name VARCHAR(50) COMMENT '权限分组',
    description TEXT COMMENT '权限描述',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限定义';

-- 角色-权限关联
CREATE TABLE role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_role_permission (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色-权限关联';

-- 操作日志
CREATE TABLE admin_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(50) NOT NULL COMMENT '操作类型',
    module VARCHAR(50) COMMENT '模块',
    target_type VARCHAR(50) COMMENT '目标类型',
    target_id VARCHAR(50) COMMENT '目标ID',
    content JSON COMMENT '操作内容',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT 'User-Agent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志';

-- 系统配置
CREATE TABLE system_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_name VARCHAR(50) NOT NULL COMMENT '配置分组',
    key_name VARCHAR(50) NOT NULL COMMENT '配置键',
    value TEXT COMMENT '配置值',
    value_type VARCHAR(20) DEFAULT 'string' COMMENT '值类型：string/number/boolean/json',
    description VARCHAR(500) COMMENT '配置描述',
    is_public TINYINT DEFAULT 0 COMMENT '是否公开',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_group_key (group_name, key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置';
```

#### 2.2.12 平台对接域表结构

```sql
-- 平台用户映射
CREATE TABLE platform_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    platform VARCHAR(20) NOT NULL COMMENT '平台：wechat/alipay/douyin/apple/google',
    platform_user_id VARCHAR(100) NOT NULL COMMENT '平台用户ID',
    platform_openid VARCHAR(100) COMMENT '平台OpenID',
    platform_unionid VARCHAR(100) COMMENT '平台UnionID',
    platform_data JSON COMMENT '平台数据',
    bind_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync_time TIMESTAMP COMMENT '最后同步时间',
    UNIQUE KEY uk_platform_user (platform, platform_user_id),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='平台用户映射';

-- 微信配置
CREATE TABLE wechat_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    app_type VARCHAR(20) NOT NULL COMMENT '应用类型：miniapp/official/app',
    app_id VARCHAR(50) NOT NULL COMMENT 'AppID',
    app_secret VARCHAR(100) COMMENT 'AppSecret',
    mch_id VARCHAR(50) COMMENT '商户号',
    api_key VARCHAR(100) COMMENT 'API密钥',
    api_cert TEXT COMMENT 'API证书',
    notify_url VARCHAR(255) COMMENT '回调地址',
    extra_config JSON COMMENT '额外配置',
    status TINYINT DEFAULT 1 COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_app_type_id (app_type, app_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='微信配置';

-- 支付宝配置
CREATE TABLE alipay_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    app_type VARCHAR(20) NOT NULL COMMENT '应用类型：miniapp/app',
    app_id VARCHAR(50) NOT NULL COMMENT 'AppID',
    private_key TEXT COMMENT '应用私钥',
    alipay_public_key TEXT COMMENT '支付宝公钥',
    notify_url VARCHAR(255) COMMENT '回调地址',
    extra_config JSON COMMENT '额外配置',
    status TINYINT DEFAULT 1 COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_app_type_id (app_type, app_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付宝配置';

-- 抖音配置
CREATE TABLE douyin_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    app_type VARCHAR(20) NOT NULL COMMENT '应用类型：miniapp',
    app_id VARCHAR(50) NOT NULL COMMENT 'AppID',
    app_secret VARCHAR(100) COMMENT 'AppSecret',
    extra_config JSON COMMENT '额外配置',
    status TINYINT DEFAULT 1 COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_app_type_id (app_type, app_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='抖音配置';
```

#### 2.2.13 统计域表结构

```sql
-- 每日统计
CREATE TABLE daily_statistics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    stat_date DATE NOT NULL COMMENT '统计日期',
    -- 用户指标
    new_users INT DEFAULT 0 COMMENT '新增用户',
    active_users INT DEFAULT 0 COMMENT '活跃用户',
    returning_users INT DEFAULT 0 COMMENT '回流用户',
    -- 游戏指标
    total_games BIGINT DEFAULT 0 COMMENT '总游戏局数',
    avg_game_duration DECIMAL(10,2) COMMENT '平均游戏时长',
    avg_score DECIMAL(10,2) COMMENT '平均分数',
    -- 收入指标
    total_revenue DECIMAL(12,2) DEFAULT 0 COMMENT '总收入',
    arpu DECIMAL(10,2) COMMENT 'ARPU',
    arppu DECIMAL(10,2) COMMENT 'ARPPU',
    paying_users INT DEFAULT 0 COMMENT '付费用户数',
    new_paying_users INT DEFAULT 0 COMMENT '新增付费用户',
    -- 广告指标
    ad_impressions BIGINT DEFAULT 0 COMMENT '广告展示次数',
    ad_revenue DECIMAL(10,2) DEFAULT 0 COMMENT '广告收入',
    -- 转化指标
    registration_rate DECIMAL(5,2) COMMENT '注册转化率',
    first_game_rate DECIMAL(5,2) COMMENT '首次游戏率',
    -- 平台分布
    platform_distribution JSON COMMENT '平台分布',
    -- 其他
    extra_metrics JSON COMMENT '扩展指标',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日统计';

-- 实时指标
CREATE TABLE realtime_metrics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    metric_name VARCHAR(50) NOT NULL COMMENT '指标名称',
    metric_value DECIMAL(15,2) COMMENT '指标值',
    metric_data JSON COMMENT '指标数据',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_metric_name (metric_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实时指标';

-- 留存统计
CREATE TABLE retention_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cohort_date DATE NOT NULL COMMENT '同期群日期',
    user_count INT NOT NULL COMMENT '用户数',
    day1_retention DECIMAL(5,2) COMMENT '次日留存率',
    day3_retention DECIMAL(5,2) COMMENT '3日留存率',
    day7_retention DECIMAL(5,2) COMMENT '7日留存率',
    day14_retention DECIMAL(5,2) COMMENT '14日留存率',
    day30_retention DECIMAL(5,2) COMMENT '30日留存率',
    day60_retention DECIMAL(5,2) COMMENT '60日留存率',
    day90_retention DECIMAL(5,2) COMMENT '90日留存率',
    retention_data JSON COMMENT '详细留存数据',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_cohort_date (cohort_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='留存统计';

-- 收入统计
CREATE TABLE revenue_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    stat_date DATE NOT NULL COMMENT '统计日期',
    -- 充值统计
    recharge_amount DECIMAL(12,2) DEFAULT 0 COMMENT '充值金额',
    recharge_orders INT DEFAULT 0 COMMENT '充值订单数',
    recharge_users INT DEFAULT 0 COMMENT '充值用户数',
    -- 消费统计
    consume_coins BIGINT DEFAULT 0 COMMENT '消费金币',
    consume_diamonds BIGINT DEFAULT 0 COMMENT '消费钻石',
    -- 商品统计
    product_sales JSON COMMENT '商品销量',
    skin_sales JSON COMMENT '皮肤销量',
    -- 渠道统计
    channel_distribution JSON COMMENT '渠道分布',
    -- 汇总
    total_revenue DECIMAL(12,2) DEFAULT 0 COMMENT '总收入',
    total_cost DECIMAL(12,2) DEFAULT 0 COMMENT '总成本',
    profit DECIMAL(12,2) DEFAULT 0 COMMENT '利润',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收入统计';
```

### 2.3 索引策略

```sql
-- 核心查询索引优化建议
-- 用户查询
CREATE INDEX idx_users_nickname ON users(nickname);
CREATE INDEX idx_users_last_login ON users(last_login_at);

-- 游戏记录查询
CREATE INDEX idx_game_records_user_date ON game_records(user_id, created_at);
CREATE INDEX idx_game_records_mode_date ON game_records(game_mode, created_at);

-- 订单查询
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_date_status ON orders(created_at, status);

-- 统计查询
CREATE INDEX idx_daily_stats_date ON daily_statistics(stat_date);
```

---

## 3. 后台功能模块

### 3.1 模块优先级分类

```
优先级定义：
P0 - 核心模块（必须有，系统基础）
P1 - 重要模块（第一阶段实现）
P2 - 扩展模块（第二阶段实现）
P3 - 未来模块（第三阶段规划）
```

### 3.2 核心模块 (P0)

#### 3.2.1 用户管理模块

| 功能 | 描述 |
|------|------|
| 用户列表 | 分页、搜索、筛选用户 |
| 用户详情 | 查看用户完整信息 |
| 用户编辑 | 修改用户信息、状态 |
| 用户封禁 | 禁用/解封用户 |
| 用户查询 | 多条件组合查询 |
| 数据导出 | 用户数据导出Excel |

#### 3.2.2 数据统计模块

| 功能 | 描述 |
|------|------|
| 数据概览 | 今日/昨日核心指标展示 |
| 实时数据 | 在线人数、实时游戏局数 |
| 用户统计 | 新增、活跃、留存趋势图 |
| 游戏统计 | 局数、时长、分数分布 |
| 收入统计 | 充值、消费、ARPU等 |
| 自定义报表 | 按需配置统计报表 |

#### 3.2.3 游戏管理模块

| 功能 | 描述 |
|------|------|
| 游戏记录 | 查询所有游戏记录 |
| 记录详情 | 查看单局游戏详情 |
| 作弊检测 | 异常分数标记与处理 |
| 排行榜管理 | 排行榜数据维护 |
| 模式配置 | 游戏模式参数配置 |

#### 3.2.4 系统管理模块

| 功能 | 描述 |
|------|------|
| 管理员管理 | 管理员账户CRUD |
| 角色管理 | 角色定义与权限分配 |
| 权限管理 | 权限定义与管理 |
| 操作日志 | 查询管理员操作日志 |
| 系统配置 | 系统参数配置 |

### 3.3 重要模块 (P1)

#### 3.3.1 道具管理模块

| 功能 | 描述 |
|------|------|
| 道具列表 | 道具定义管理 |
| 道具配置 | 道具效果、价格配置 |
| 商店配置 | 上架、定价、限购 |
| 道具日志 | 道具获取/使用记录 |
| 库存管理 | 道具发放、调整 |

#### 3.3.2 皮肤管理模块

| 功能 | 描述 |
|------|------|
| 皮肤列表 | 皮肤定义管理 |
| 皮肤配置 | 皮肤样式、价格配置 |
| 商店配置 | 上架、限量、时效 |
| 交易记录 | 皮肤购买/赠送记录 |
| 皮肤预览 | 皮肤效果预览 |

#### 3.3.3 成就管理模块

| 功能 | 描述 |
|------|------|
| 成就列表 | 成就定义管理 |
| 成就配置 | 成就条件、奖励配置 |
| 成就统计 | 成就解锁统计 |
| 奖励管理 | 成就奖励发放记录 |

#### 3.3.4 任务管理模块

| 功能 | 描述 |
|------|------|
| 任务列表 | 每日任务配置 |
| 任务统计 | 任务完成率统计 |
| 奖励配置 | 任务奖励配置 |
| 任务日志 | 任务完成记录 |

#### 3.3.5 赛季管理模块

| 功能 | 描述 |
|------|------|
| 赛季配置 | 赛季时间、规则配置 |
| 奖励配置 | 赛季奖励配置 |
| 排名管理 | 赛季排名查看 |
| 赛季统计 | 赛季参与数据统计 |

#### 3.3.6 反馈管理模块

| 功能 | 描述 |
|------|------|
| 反馈列表 | 用户反馈查看 |
| 反馈处理 | 回复、标记处理 |
| 反馈统计 | 反馈类型、处理率统计 |
| 常见问题 | FAQ管理 |

### 3.4 扩展模块 (P2)

#### 3.4.1 商城管理模块

| 功能 | 描述 |
|------|------|
| 商品管理 | 商品定义、上下架 |
| 订单管理 | 订单查询、处理 |
| 支付管理 | 支付配置、对账 |
| 退款管理 | 退款申请处理 |
| 促销管理 | 优惠活动配置 |

#### 3.4.2 VIP管理模块

| 功能 | 描述 |
|------|------|
| 等级配置 | VIP等级、权益配置 |
| 会员列表 | VIP用户管理 |
| 权益管理 | VIP权益配置 |
| 会员统计 | VIP数据统计 |

#### 3.4.3 广告管理模块

| 功能 | 描述 |
|------|------|
| 广告位管理 | 广告位配置 |
| 广告网络 | 多广告网络配置 |
| 展示统计 | 广告展示数据 |
| 收益统计 | 广告收益统计 |

#### 3.4.4 好友管理模块

| 功能 | 描述 |
|------|------|
| 好友关系 | 查看好友关系 |
| 好友统计 | 社交数据统计 |
| 举报处理 | 好友相关举报处理 |

#### 3.4.5 分享管理模块

| 功能 | 描述 |
|------|------|
| 分享配置 | 分享内容、渠道配置 |
| 分享统计 | 分享数据统计 |
| 邀请奖励 | 邀请奖励配置 |
| 裂变分析 | 裂变效果分析 |

#### 3.4.6 内容管理模块

| 功能 | 描述 |
|------|------|
| 公告管理 | 系统公告发布 |
| 活动管理 | 运营活动配置 |
| 推送管理 | 消息推送配置 |
| 敏感词管理 | 敏感词过滤配置 |

### 3.5 未来模块 (P3)

#### 3.5.1 多平台管理模块

| 功能 | 描述 |
|------|------|
| 平台配置 | 各平台接入配置 |
| 版本管理 | 多平台版本管理 |
| 审核管理 | 小程序审核管理 |
| 平台数据 | 分平台数据统计 |

#### 3.5.2 运营工具模块

| 功能 | 描述 |
|------|------|
| AB测试 | 功能AB测试配置 |
| 用户分群 | 用户标签分群 |
| 精准推送 | 分群消息推送 |
| 自动化运营 | 自动化任务配置 |

#### 3.5.3 数据分析模块

| 功能 | 描述 |
|------|------|
| 漏斗分析 | 转化漏斗分析 |
| 路径分析 | 用户行为路径 |
| 归因分析 | 渠道归因分析 |
| 预测分析 | AI预测模型 |

#### 3.5.4 风控管理模块

| 功能 | 描述 |
|------|------|
| 风险规则 | 风控规则配置 |
| 黑名单 | 黑名单管理 |
| 异常监控 | 异常行为监控 |
| 风险报告 | 风险分析报告 |

---

## 4. 技术架构

### 4.1 架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                         客户端层                                  │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│   Web H5    │ 微信小程序  │ 支付宝小程序 │ 抖音小程序  │  App    │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴────┬────┘
       │             │             │             │           │
       ▼             ▼             ▼             ▼           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CDN / 负载均衡                            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API网关层                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │ 认证鉴权 │  │ 限流熔断 │  │ 路由转发 │  │ 日志监控        ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       应用服务层                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ 后台API服务 │  │ 游戏API服务 │  │ 开放API服务(多平台对接) │ │
│  │  (Admin)    │  │  (Game)     │  │      (Open)             │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                     │               │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────────┴──────────────┐│
│  │ 用户服务    │  │ 游戏服务    │  │ 支付服务                ││
│  │ 道具服务    │  │ 成就服务    │  │ 消息服务                ││
│  │ 皮肤服务    │  │ 排行榜服务  │  │ 统计服务                ││
│  └─────────────┘  └─────────────┘  └─────────────────────────┘│
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       数据存储层                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │  MySQL   │  │  Redis   │  │ MongoDB  │  │ 对象存储OSS     ││
│  │ (主数据) │  │ (缓存)   │  │ (日志)   │  │ (图片/文件)     ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 前端技术选型

#### 4.2.1 后台管理前端

| 技术 | 选型 | 理由 |
|------|------|------|
| 框架 | Vue 3 + TypeScript | 主流、生态丰富、TypeScript支持好 |
| UI组件库 | Ant Design Vue | 企业级组件、功能完善 |
| 状态管理 | Pinia | Vue 3官方推荐 |
| 路由 | Vue Router 4 | 官方路由方案 |
| 构建工具 | Vite | 快速开发体验 |
| 图表库 | ECharts | 功能强大、图表丰富 |
| 表格 | VxeTable | 高性能表格组件 |
| HTTP客户端 | Axios | 主流、拦截器支持好 |
| CSS方案 | TailwindCSS | 高效、原子化 |

#### 4.2.2 游戏前端扩展

| 技术 | 选型 | 说明 |
|------|------|------|
| 框架 | Vue 3 | 保持一致 |
| 跨平台 | Taro 3 | 一码多端(微信/支付宝/抖音) |
| 状态管理 | Pinia | 统一状态管理 |
| 小程序适配 | 原生优化 | 性能关键页面 |

### 4.3 后端技术选型

#### 4.3.1 后台API服务

| 技术 | 选型 | 理由 |
|------|------|------|
| 运行时 | Node.js 18 LTS | 与现有项目一致、异步高效 |
| 框架 | NestJS | 企业级、模块化、TypeScript原生支持 |
| ORM | TypeORM | TypeScript友好、装饰器模式 |
| 数据库 | MySQL 8.0 | 现有数据库、事务支持好 |
| 缓存 | Redis 7 | 高性能缓存、会话存储 |
| 消息队列 | BullMQ | Node.js原生、Redis驱动 |
| 日志 | Winston + ELK | 结构化日志、集中管理 |
| API文档 | Swagger | 自动生成、在线调试 |

#### 4.3.2 游戏API服务（现有扩展）

| 技术 | 选型 | 说明 |
|------|------|------|
| 运行时 | Node.js 18 | 保持一致 |
| 框架 | Express/Koa | 现有框架扩展 |
| ORM | Sequelize | 现有ORM |

### 4.4 部署方案

#### 4.4.1 容器化部署

```yaml
# docker-compose.yml 架构
services:
  # 后台API
  admin-api:
    image: node:18-alpine
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
    depends_on:
      - mysql
      - redis

  # 后台前端
  admin-web:
    image: nginx:alpine
    ports:
      - "8081:80"
    volumes:
      - ./admin-web/dist:/usr/share/nginx/html

  # MySQL (现有)
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Nginx (反向代理)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./ssl:/etc/nginx/ssl

volumes:
  mysql_data:
  redis_data:
```

#### 4.4.2 进程管理

```bash
# PM2 配置
module.exports = {
  apps: [
    {
      name: 'admin-api',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    },
    {
      name: 'game-api',
      script: 'server.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
```

### 4.5 扩展性设计

#### 4.5.1 微服务预留

```
当前：单体应用 (Monolith)
     ↓
阶段2：模块化单体 (Modular Monolith)
     ↓
阶段3：微服务 (Microservices) [按需拆分]
```

**服务拆分预留点：**
- 用户服务
- 游戏服务
- 支付服务
- 统计服务
- 消息服务

#### 4.5.2 多平台适配层

```
┌─────────────────────────────────────┐
│           统一API层                  │
├─────────────────────────────────────┤
│          平台适配层                  │
│  ┌─────────┬─────────┬─────────┐   │
│  │微信适配器│支付宝适配│抖音适配器│   │
│  └─────────┴─────────┴─────────┘   │
│  ┌─────────┬─────────┬─────────┐   │
│  │ iOS适配 │Android适配│ Web适配│   │
│  └─────────┴─────────┴─────────┘   │
├─────────────────────────────────────┤
│           核心业务层                 │
└─────────────────────────────────────┘
```

#### 4.5.3 数据分片预留

```sql
-- 分片键设计建议
-- 用户表：按 user_id 分片
-- 游戏记录：按 user_id + created_at 分片
-- 订单表：按 order_no 分片

-- 分片策略配置表
CREATE TABLE sharding_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(50) NOT NULL,
    sharding_key VARCHAR(50) NOT NULL,
    sharding_type VARCHAR(20) NOT NULL, -- hash/range
    shard_count INT DEFAULT 4,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. API设计

### 5.1 API架构

```
/api
├── /v1                        # API版本
│   ├── /admin                 # 后台管理API
│   │   ├── /auth              # 认证相关
│   │   ├── /users             # 用户管理
│   │   ├── /games             # 游戏管理
│   │   ├── /items             # 道具管理
│   │   ├── /skins             # 皮肤管理
│   │   ├── /achievements      # 成就管理
│   │   ├── /tasks             # 任务管理
│   │   ├── /seasons           # 赛季管理
│   │   ├── /shop              # 商城管理
│   │   ├── /orders            # 订单管理
│   │   ├── /payments          # 支付管理
│   │   ├── /vip               # VIP管理
│   │   ├── /feedback          # 反馈管理
│   │   ├── /content           # 内容管理
│   │   ├── /statistics        # 统计分析
│   │   └── /system            # 系统管理
│   │
│   ├── /game                  # 游戏API (现有扩展)
│   │   ├── /auth              # 游戏认证
│   │   ├── /user              # 用户相关
│   │   ├── /play              # 游戏相关
│   │   ├── /shop              # 游戏内商店
│   │   ├── /social            # 社交相关
│   │   └── /sync              # 数据同步
│   │
│   └── /open                   # 开放API (多平台)
│       ├── /wechat             # 微信接口
│       ├── /alipay             # 支付宝接口
│       ├── /douyin             # 抖音接口
│       └── /platform           # 通用平台接口
```

### 5.2 后台管理API详细设计

#### 5.2.1 认证模块

```yaml
# 管理员登录
POST /api/v1/admin/auth/login
Request:
  username: string
  password: string
  captcha?: string
Response:
  code: number
  data:
    token: string
    refreshToken: string
    expiresIn: number
    admin:
      id: number
      username: string
      name: string
      role: object
      permissions: string[]

# 刷新Token
POST /api/v1/admin/auth/refresh
Request:
  refreshToken: string
Response:
  code: number
  data:
    token: string
    expiresIn: number

# 退出登录
POST /api/v1/admin/auth/logout
Headers:
  Authorization: Bearer {token}
Response:
  code: number
  message: string

# 获取当前用户信息
GET /api/v1/admin/auth/me
Headers:
  Authorization: Bearer {token}
Response:
  code: number
  data:
    id: number
    username: string
    name: string
    email: string
    avatar: string
    role: object
    permissions: string[]
```

#### 5.2.2 用户管理模块

```yaml
# 用户列表
GET /api/v1/admin/users
Query:
  page: number (default: 1)
  pageSize: number (default: 20)
  keyword?: string        # 昵称搜索
  status?: number         # 状态筛选
  vipLevel?: number       # VIP等级筛选
  startDate?: string      # 注册开始日期
  endDate?: string        # 注册结束日期
  orderBy?: string        # 排序字段
  orderDir?: string       # asc/desc
Response:
  code: number
  data:
    list: User[]
    pagination:
      page: number
      pageSize: number
      total: number
      totalPages: number

# 用户详情
GET /api/v1/admin/users/:id
Response:
  code: number
  data:
    user: User
    profile: UserProfile
    settings: UserSettings
    statistics: UserStatistics
    recentGames: GameRecord[]
    achievements: UserAchievement[]

# 更新用户
PUT /api/v1/admin/users/:id
Request:
  nickname?: string
  status?: number
  vipLevel?: number
  coins?: number
  diamonds?: number
Response:
  code: number
  message: string

# 封禁用户
POST /api/v1/admin/users/:id/ban
Request:
  reason: string
  duration?: number       # 封禁天数，null为永久
Response:
  code: number
  message: string

# 解封用户
POST /api/v1/admin/users/:id/unban
Response:
  code: number
  message: string

# 发放奖励
POST /api/v1/admin/users/:id/reward
Request:
  type: string           # coins/diamonds/items/skin
  amount: number
  itemId?: number
  reason: string
Response:
  code: number
  message: string

# 用户数据导出
GET /api/v1/admin/users/export
Query:
  # 同列表查询参数
Response:
  # 文件下载
```

#### 5.2.3 统计分析模块

```yaml
# 数据概览
GET /api/v1/admin/statistics/overview
Query:
  date?: string          # 日期，默认今天
Response:
  code: number
  data:
    today:
      newUsers: number
      activeUsers: number
      totalGames: number
      totalRevenue: number
      arpu: number
    yesterday:
      newUsers: number
      activeUsers: number
      totalGames: number
      totalRevenue: number
    comparison:          # 环比数据
      newUsersGrowth: number
      activeUsersGrowth: number
      revenueGrowth: number

# 实时数据
GET /api/v1/admin/statistics/realtime
Response:
  code: number
  data:
    onlineUsers: number
    todayGames: number
    todayRevenue: number
    lastUpdateTime: string

# 用户统计趋势
GET /api/v1/admin/statistics/users/trend
Query:
  metric: string         # newUsers/activeUsers/retention
  startDate: string
  endDate: string
  granularity: string    # day/week/month
Response:
  code: number
  data:
    labels: string[]
    values: number[]
    comparison?: object

# 游戏统计趋势
GET /api/v1/admin/statistics/games/trend
Query:
  metric: string         # totalGames/avgScore/avgDuration
  startDate: string
  endDate: string
  granularity: string
Response:
  code: number
  data:
    labels: string[]
    values: number[]
    breakdown?: object   # 按模式分组

# 收入统计
GET /api/v1/admin/statistics/revenue
Query:
  startDate: string
  endDate: string
  groupBy?: string       # channel/product
Response:
  code: number
  data:
    total: number
    breakdown: object[]
    trend: object

# 留存分析
GET /api/v1/admin/statistics/retention
Query:
  startDate: string
  endDate: string
Response:
  code: number
  data:
    cohorts: object[]
    avgRetention:
      day1: number
      day7: number
      day30: number
```

#### 5.2.4 游戏管理模块

```yaml
# 游戏记录列表
GET /api/v1/admin/games/records
Query:
  page: number
  pageSize: number
  userId?: number
  gameMode?: string
  minScore?: number
  maxScore?: number
  startDate?: string
  endDate?: string
  orderBy?: string
Response:
  code: number
  data:
    list: GameRecord[]
    pagination: object

# 游戏记录详情
GET /api/v1/admin/games/records/:id
Response:
  code: number
  data:
    record: GameRecord
    user: User
    analysis?: object     # 异常分析

# 排行榜管理
GET /api/v1/admin/games/leaderboard
Query:
  type: string           # all/classic/challenge/timelimit/extreme
  season?: number
Response:
  code: number
  data:
    list: LeaderboardEntry[]

# 游戏模式配置
GET /api/v1/admin/games/modes
Response:
  code: number
  data:
    list: GameMode[]

# 更新游戏模式
PUT /api/v1/admin/games/modes/:id
Request:
  name?: string
  rules?: object
  rewards?: object
  status?: number
Response:
  code: number
  message: string

# 作弊检测
GET /api/v1/admin/games/suspicious
Query:
  page: number
  pageSize: number
  type?: string          # score/time/pattern
Response:
  code: number
  data:
    list: SuspiciousRecord[]
    pagination: object

# 处理作弊记录
POST /api/v1/admin/games/suspicious/:id/handle
Request:
  action: string         # dismiss/warn/ban
  note?: string
Response:
  code: number
  message: string
```

#### 5.2.5 道具管理模块

```yaml
# 道具列表
GET /api/v1/admin/items
Response:
  code: number
  data:
    list: Item[]

# 创建道具
POST /api/v1/admin/items
Request:
  code: string
  name: string
  type: string
  effect: object
  priceCoins: number
  priceDiamonds: number
  maxCount: number
Response:
  code: number
  data:
    item: Item

# 更新道具
PUT /api/v1/admin/items/:id
Request:
  # 可更新字段
Response:
  code: number
  message: string

# 商店配置列表
GET /api/v1/admin/items/shop
Query:
  category?: string
Response:
  code: number
  data:
    list: ItemShop[]

# 更新商店配置
PUT /api/v1/admin/items/shop/:id
Request:
  discount?: number
  limitType?: string
  limitCount?: number
  startTime?: string
  endTime?: string
  status?: number
Response:
  code: number
  message: string

# 道具使用统计
GET /api/v1/admin/items/statistics
Query:
  itemId?: number
  startDate: string
  endDate: string
Response:
  code: number
  data:
    usageTrend: object[]
    topUsers: object[]
```

#### 5.2.6 皮肤管理模块

```yaml
# 皮肤列表
GET /api/v1/admin/skins
Query:
  category?: string
  status?: number
Response:
  code: number
  data:
    list: Skin[]

# 创建皮肤
POST /api/v1/admin/skins
Request:
  code: string
  name: string
  category: string
  config: object
  previewImage: string
  priceCoins: number
  priceDiamonds: number
  priceRmb: number
  rarity: string
  isLimited: boolean
  limitedCount?: number
Response:
  code: number
  data:
    skin: Skin

# 更新皮肤
PUT /api/v1/admin/skins/:id
Request:
  # 可更新字段
Response:
  code: number
  message: string

# 皮肤销售统计
GET /api/v1/admin/skins/statistics
Query:
  skinId?: number
  startDate: string
  endDate: string
Response:
  code: number
  data:
    salesTrend: object[]
    topSkins: object[]
    revenue: number
```

#### 5.2.7 订单管理模块

```yaml
# 订单列表
GET /api/v1/admin/orders
Query:
  page: number
  pageSize: number
  orderNo?: string
  userId?: number
  status?: string
  startDate?: string
  endDate?: string
Response:
  code: number
  data:
    list: Order[]
    pagination: object

# 订单详情
GET /api/v1/admin/orders/:id
Response:
  code: number
  data:
    order: Order
    user: User
    payment?: Payment
    refund?: Refund

# 退款处理
POST /api/v1/admin/orders/:id/refund
Request:
  amount: number
  reason: string
Response:
  code: number
  message: string

# 订单统计
GET /api/v1/admin/orders/statistics
Query:
  startDate: string
  endDate: string
  groupBy?: string       # day/channel/product
Response:
  code: number
  data:
    summary: object
    trend: object[]
```

#### 5.2.8 系统管理模块

```yaml
# 管理员列表
GET /api/v1/admin/system/admins
Query:
  page: number
  pageSize: number
  keyword?: string
  status?: number
Response:
  code: number
  data:
    list: Admin[]
    pagination: object

# 创建管理员
POST /api/v1/admin/system/admins
Request:
  username: string
  password: string
  name: string
  email?: string
  phone?: string
  roleId: number
  department?: string
Response:
  code: number
  data:
    admin: Admin

# 更新管理员
PUT /api/v1/admin/system/admins/:id
Request:
  # 可更新字段
Response:
  code: number
  message: string

# 角色列表
GET /api/v1/admin/system/roles
Response:
  code: number
  data:
    list: Role[]

# 创建角色
POST /api/v1/admin/system/roles
Request:
  code: string
  name: string
  description?: string
  permissions: number[]
Response:
  code: number
  data:
    role: Role

# 权限列表
GET /api/v1/admin/system/permissions
Response:
  code: number
  data:
    list: Permission[]
    tree: object         # 树形结构

# 操作日志
GET /api/v1/admin/system/logs
Query:
  page: number
  pageSize: number
  adminId?: number
  action?: string
  startDate?: string
  endDate?: string
Response:
  code: number
  data:
    list: AdminLog[]
    pagination: object

# 系统配置
GET /api/v1/admin/system/configs
Query:
  group?: string
Response:
  code: number
  data:
    list: SystemConfig[]
    groups: string[]

# 更新系统配置
PUT /api/v1/admin/system/configs/:id
Request:
  value: string
Response:
  code: number
  message: string
```

### 5.3 多平台对接API预留设计

#### 5.3.1 通用平台接口

```yaml
# 平台用户登录
POST /api/v1/open/platform/login
Request:
  platform: string       # wechat/alipay/douyin
  code: string          # 平台授权码
  userInfo?: object     # 用户信息
Response:
  code: number
  data:
    token: string
    isNewUser: boolean
    user: User

# 平台支付回调
POST /api/v1/open/platform/payment/notify
Request:
  platform: string
  # 平台特定参数
Response:
  # 平台特定响应

# 平台数据同步
POST /api/v1/open/platform/sync
Request:
  platform: string
  type: string          # user/order/game
  data: object
Response:
  code: number
  message: string
```

#### 5.3.2 微信小程序接口

```yaml
# 微信登录
POST /api/v1/open/wechat/login
Request:
  code: string          # wx.login获取的code
  encryptedData?: string
  iv?: string
Response:
  code: number
  data:
    token: string
    openid: string
    sessionKey: string
    isNewUser: boolean

# 微信支付
POST /api/v1/open/wechat/pay
Request:
  orderNo: string
  openId: string
Response:
  code: number
  data:
    # 小程序支付参数
    timeStamp: string
    nonceStr: string
    package: string
    signType: string
    paySign: string

# 微信分享
POST /api/v1/open/wechat/share
Request:
  type: string
  shareData: object
Response:
  code: number
  data:
    # 分享配置
```

#### 5.3.3 支付宝小程序接口

```yaml
# 支付宝登录
POST /api/v1/open/alipay/login
Request:
  authCode: string
Response:
  code: number
  data:
    token: string
    userId: string
    isNewUser: boolean

# 支付宝支付
POST /api/v1/open/alipay/pay
Request:
  orderNo: string
  buyerId: string
Response:
  code: number
  data:
    # 支付宝支付参数
```

#### 5.3.4 抖音小程序接口

```yaml
# 抖音登录
POST /api/v1/open/douyin/login
Request:
  code: string
  anonymousCode?: string
Response:
  code: number
  data:
    token: string
    openId: string
    isNewUser: boolean
```

### 5.4 API响应规范

```yaml
# 成功响应
{
  "code": 0,
  "message": "success",
  "data": { ... }
}

# 分页响应
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [ ... ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}

# 错误响应
{
  "code": 40001,
  "message": "参数错误",
  "errors": [
    {
      "field": "username",
      "message": "用户名不能为空"
    }
  ]
}

# 错误码定义
# 0     - 成功
# 400xx - 参数错误
# 401xx - 认证错误
# 403xx - 权限错误
# 404xx - 资源不存在
# 500xx - 服务器错误
```

---

## 6. 团队分工

### 6.1 团队架构

```
Hermes团队
├── 策衡 (协调官) - 项目总控、规划协调
│
├── 绘境 (设计师) - 界面设计、视觉规范
│   ├── 后台界面设计
│   ├── 游戏UI优化
│   └── 多平台适配设计
│
├── 营拓 (营销师) - 功能规划、运营策略
│   ├── 功能需求梳理
│   ├── 运营策略制定
│   └── 数据分析规划
│
├── 技研 (技术师) - 代码实现、架构搭建
│   ├── 后端开发
│   ├── 前端开发
│   └── 运维部署
│
└── 验真 (测试师) - 功能测试、质量验证
    ├── 功能测试
    ├── 性能测试
    └── 安全测试
```

### 6.2 详细分工

#### 6.2.1 绘境（设计师）

**第一阶段：后台设计**
| 任务 | 内容 | 交付物 |
|------|------|--------|
| 设计系统 | 建立设计规范系统 | 设计规范文档 |
| 风格定义 | 配色、字体、组件风格 | 风格指南 |
| 登录页面 | 后台登录页设计 | 设计稿 |
| 数据概览 | Dashboard设计 | 设计稿 |
| 用户管理 | 用户列表、详情页设计 | 设计稿 |
| 数据统计 | 统计图表页面设计 | 设计稿 |
| 游戏管理 | 游戏记录、配置页设计 | 设计稿 |

**第二阶段：扩展功能设计**
| 任务 | 内容 | 交付物 |
|------|------|--------|
| 道具管理 | 道具配置页面设计 | 设计稿 |
| 皮肤管理 | 皮肤配置页面设计 | 设计稿 |
| 商城管理 | 商品、订单管理页面设计 | 设计稿 |
| VIP管理 | VIP配置页面设计 | 设计稿 |
| 广告管理 | 广告配置页面设计 | 设计稿 |

**第三阶段：多平台设计**
| 任务 | 内容 | 交付物 |
|------|------|--------|
| 小程序设计 | 微信/支付宝小程序UI | 设计稿 |
| App设计 | iOS/Android App UI | 设计稿 |
| 适配规范 | 多平台适配规范 | 规范文档 |

#### 6.2.2 营拓（营销师）

**第一阶段：功能规划**
| 任务 | 内容 | 交付物 |
|------|------|--------|
| 需求分析 | 梳理后台功能需求 | 需求文档 |
| 数据指标 | 定义核心数据指标 | 指标定义文档 |
| 权限规划 | 后台角色权限规划 | 权限矩阵 |

**第二阶段：运营策略**
| 任务 | 内容 | 交付物 |
|------|------|--------|
| 道具定价 | 道具商城定价策略 | 定价方案 |
| 皮肤规划 | 皮肤系列规划 | 皮肤规划文档 |
| VIP权益 | VIP等级权益规划 | VIP权益文档 |
| 活动策划 | 运营活动方案 | 活动方案 |

**第三阶段：增长策略**
| 任务 | 内容 | 交付物 |
|------|------|--------|
| 用户增长 | 用户增长策略 | 增长方案 |
| 变现策略 | 商业化变现方案 | 变现方案 |
| 跨平台运营 | 多平台运营策略 | 运营方案 |

#### 6.2.3 技研（技术师）

**第一阶段：基础架构**
| 任务 | 内容 | 交付物 |
|------|------|--------|
| 技术选型 | 确定技术栈 | 技术选型报告 |
| 数据库设计 | 实现数据库表结构 | SQL脚本 |
| 后端框架 | 搭建后台API框架 | 项目代码 |
| 前端框架 | 搭建后台前端框架 | 项目代码 |
| 部署方案 | 配置部署环境 | 部署文档 |

**第二阶段：核心功能**
| 任务 | 内容 | 交付物 |
|------|------|--------|
| 认证模块 | 登录、权限、日志 | 代码+文档 |
| 用户管理 | 用户CRUD、封禁等 | 代码+文档 |
| 数据统计 | 统计报表、图表 | 代码+文档 |
| 游戏管理 | 记录查询、配置 | 代码+文档 |
| 系统管理 | 管理员、角色、配置 | 代码+文档 |

**第三阶段：扩展功能**
| 任务 | 内容 | 交付物 |
|------|------|--------|
| 道具系统 | 道具管理、商店 | 代码+文档 |
| 皮肤系统 | 皮肤管理、交易 | 代码+文档 |
| 商城系统 | 商品、订单、支付 | 代码+文档 |
| VIP系统 | VIP等级、权益 | 代码+文档 |
| 多平台对接 | 微信、支付宝等 | 代码+文档 |

#### 6.2.4 验真（测试师）

**第一阶段：测试准备**
| 任务 | 内容 | 交付物 |
|------|------|--------|
| 测试计划 | 制定测试计划 | 测试计划文档 |
| 测试用例 | 编写核心功能用例 | 测试用例 |
| 测试环境 | 搭建测试环境 | 环境文档 |

**第二阶段：功能测试**
| 任务 | 内容 | 交付物 |
|------|------|--------|
| 登录测试 | 认证、权限测试 | 测试报告 |
| 用户测试 | 用户管理功能测试 | 测试报告 |
| 统计测试 | 数据统计功能测试 | 测试报告 |
| 游戏测试 | 游戏管理功能测试 | 测试报告 |

**第三阶段：质量保障**
| 任务 | 内容 | 交付物 |
|------|------|--------|
| 性能测试 | 压力测试、优化 | 性能报告 |
| 安全测试 | 安全漏洞扫描 | 安全报告 |
| 兼容测试 | 多平台兼容测试 | 兼容报告 |
| 上线验收 | 上线前验收测试 | 验收报告 |

### 6.3 协作流程

```
需求阶段：
  营拓输出需求 → 策衡评审 → 绘境设计 → 技研评估 → 验真确认

开发阶段：
  绘境交付设计 → 技研开发 → 验真测试 → 反馈修复 → 合并发布

上线阶段：
  技研部署 → 验真验收 → 策衡确认 → 正式上线

迭代阶段：
  营拓收集反馈 → 策衡规划迭代 → 重复以上流程
```

---

## 7. 执行计划

### 7.1 阶段划分

```
第0阶段：准备工作（1周）
    └── 环境搭建、技术选型确认

第1阶段：核心后台（4周）
    ├── 基础架构搭建
    ├── 用户管理模块
    ├── 数据统计模块
    ├── 游戏管理模块
    └── 系统管理模块

第2阶段：功能扩展（4周）
    ├── 道具管理模块
    ├── 皮肤管理模块
    ├── 成就管理模块
    ├── 任务/赛季管理
    └── 反馈管理模块

第3阶段：商业化（4周）
    ├── 商城管理模块
    ├── 订单支付模块
    ├── VIP管理模块
    └── 广告管理模块

第4阶段：多平台（4周）
    ├── 微信小程序对接
    ├── 支付宝小程序对接
    ├── 抖音小程序对接
    └── App版本准备

第5阶段：优化完善（2周）
    ├── 性能优化
    ├── 安全加固
    └── 文档完善
```

### 7.2 详细计划

#### 第0阶段：准备工作（1周）

| 周次 | 任务 | 负责人 | 交付物 |
|------|------|--------|--------|
| W1 | 技术选型确认 | 技研 | 技术选型报告 |
| W1 | 开发环境搭建 | 技研 | 开发环境 |
| W1 | 设计规范制定 | 绘境 | 设计规范 |
| W1 | 需求确认 | 营拓 | 需求文档v1.0 |
| W1 | 测试计划制定 | 验真 | 测试计划 |

#### 第1阶段：核心后台（4周）

**W2：基础架构**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| 数据库表结构创建 | 技研 | 8h |
| 后端项目框架搭建 | 技研 | 12h |
| 前端项目框架搭建 | 技研 | 12h |
| 登录页面设计 | 绘境 | 4h |
| API文档规范制定 | 技研 | 4h |

**W3：用户管理**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| 用户管理页面设计 | 绘境 | 8h |
| 用户管理API开发 | 技研 | 16h |
| 用户管理前端开发 | 技研 | 16h |
| 用户管理功能测试 | 验真 | 8h |

**W4：数据统计**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| Dashboard设计 | 绘境 | 12h |
| 统计API开发 | 技研 | 20h |
| 统计前端开发 | 技研 | 20h |
| 图表组件封装 | 技研 | 8h |
| 统计功能测试 | 验真 | 8h |

**W5：游戏管理 + 系统管理**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| 游戏管理页面设计 | 绘境 | 8h |
| 游戏管理API开发 | 技研 | 12h |
| 系统管理API开发 | 技研 | 16h |
| 系统管理前端开发 | 技研 | 16h |
| 第1阶段验收测试 | 验真 | 16h |

#### 第2阶段：功能扩展（4周）

**W6：道具管理**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| 道具管理设计 | 绘境 | 6h |
| 道具管理API开发 | 技研 | 16h |
| 道具商店配置开发 | 技研 | 12h |
| 道具管理功能测试 | 验真 | 8h |

**W7：皮肤管理**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| 皮肤管理设计 | 绘境 | 8h |
| 皮肤管理API开发 | 技研 | 16h |
| 皮肤商店配置开发 | 技研 | 12h |
| 皮肤管理功能测试 | 验真 | 8h |

**W8：成就 + 任务管理**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| 成就管理设计 | 绘境 | 6h |
| 成就管理API开发 | 技研 | 12h |
| 任务管理API开发 | 技研 | 12h |
| 赛季管理API开发 | 技研 | 8h |
| 功能测试 | 验真 | 12h |

**W9：反馈管理 + 阶段验收**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| 反馈管理设计 | 绘境 | 4h |
| 反馈管理API开发 | 技研 | 12h |
| 反馈管理前端开发 | 技研 | 12h |
| 第2阶段验收测试 | 验真 | 16h |

#### 第3阶段：商业化（4周）

**W10：商城管理**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| 商城管理设计 | 绘境 | 8h |
| 商品管理API开发 | 技研 | 12h |
| 商城前端开发 | 技研 | 16h |
| 商品功能测试 | 验真 | 8h |

**W11：订单支付**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| 订单管理设计 | 绘境 | 6h |
| 订单管理API开发 | 技研 | 16h |
| 支付模块开发 | 技研 | 20h |
| 支付功能测试 | 验真 | 12h |

**W12：VIP管理**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| VIP管理设计 | 绘境 | 6h |
| VIP管理API开发 | 技研 | 16h |
| VIP权益开发 | 技研 | 12h |
| VIP功能测试 | 验真 | 8h |

**W13：广告管理 + 阶段验收**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| 广告管理设计 | 绘境 | 4h |
| 广告管理API开发 | 技研 | 12h |
| 广告统计开发 | 技研 | 8h |
| 第3阶段验收测试 | 验真 | 16h |

#### 第4阶段：多平台（4周）

**W14：微信小程序**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| 小程序设计适配 | 绘境 | 12h |
| 微信登录对接 | 技研 | 16h |
| 微信支付对接 | 技研 | 16h |
| 微信分享对接 | 技研 | 8h |
| 小程序功能测试 | 验真 | 12h |

**W15：支付宝小程序**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| 支付宝登录对接 | 技研 | 12h |
| 支付宝支付对接 | 技研 | 12h |
| 平台适配优化 | 技研 | 8h |
| 支付宝功能测试 | 验真 | 8h |

**W16：抖音小程序**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| 抖音登录对接 | 技研 | 12h |
| 抖音支付对接 | 技研 | 12h |
| 平台适配优化 | 技研 | 8h |
| 抖音功能测试 | 验真 | 8h |

**W17：多平台优化 + 阶段验收**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| 多平台数据同步 | 技研 | 12h |
| 平台兼容性优化 | 技研 | 8h |
| 多平台验收测试 | 验真 | 16h |

#### 第5阶段：优化完善（2周）

**W18：性能优化**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| 后端性能优化 | 技研 | 16h |
| 前端性能优化 | 技研 | 12h |
| 数据库优化 | 技研 | 8h |
| 性能测试 | 验真 | 12h |

**W19：安全加固 + 文档**
| 任务 | 负责人 | 预计工时 |
|------|--------|----------|
| 安全漏洞修复 | 技研 | 12h |
| API文档完善 | 技研 | 8h |
| 部署文档完善 | 技研 | 4h |
| 最终验收 | 验真 | 16h |
| 项目交付 | 策衡 | 4h |

### 7.3 交付标准

#### 功能交付标准

| 类型 | 标准 |
|------|------|
| 功能完整性 | 所有需求功能实现率100% |
| 功能正确性 | 核心功能无P0/P1级Bug |
| 性能要求 | API响应时间<500ms |
| 安全要求 | 无高危安全漏洞 |
| 兼容性 | 支持Chrome/Firefox/Safari最新版 |

#### 代码交付标准

| 类型 | 标准 |
|------|------|
| 代码规范 | 符合ESLint/Prettier规范 |
| 注释覆盖 | 核心代码注释覆盖率>80% |
| 单元测试 | 核心模块单元测试覆盖率>60% |
| 文档完整 | API文档、部署文档齐全 |

#### 设计交付标准

| 类型 | 标准 |
|------|------|
| 设计稿 | 所有页面设计稿完成 |
| 切图资源 | 所有图标、图片资源导出 |
| 设计规范 | 设计规范文档完整 |
| 交互说明 | 关键交互流程说明 |

---

## 8. 风险评估

### 8.1 技术风险

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| 技术选型不当 | 中 | 高 | 充分调研、POC验证 |
| 性能瓶颈 | 中 | 高 | 压力测试、架构优化 |
| 数据库设计缺陷 | 低 | 高 | 评审机制、预留扩展 |
| 安全漏洞 | 中 | 高 | 安全扫描、代码审计 |

### 8.2 进度风险

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| 需求变更频繁 | 高 | 中 | 需求冻结机制 |
| 人员不足 | 中 | 高 | 合理排期、外部支持 |
| 技术难点耗时 | 中 | 中 | 预留缓冲时间 |
| 联调阻塞 | 中 | 中 | Mock数据、并行开发 |

### 8.3 业务风险

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| 支付对接问题 | 中 | 高 | 提前申请资质 |
| 小程序审核不通过 | 中 | 中 | 了解审核规范 |
| 用户数据丢失 | 低 | 高 | 数据备份机制 |
| 运营策略调整 | 高 | 低 | 模块化设计 |

### 8.4 风险监控

```
风险监控机制：
1. 每周风险评审会议
2. 风险登记册更新
3. 预警机制触发条件
4. 应急响应流程
```

---

## 9. 附录

### 9.1 技术栈清单

**后端：**
- Node.js 18 LTS
- NestJS 10
- TypeORM 0.3
- MySQL 8.0
- Redis 7
- BullMQ
- Winston
- Swagger

**前端：**
- Vue 3.3
- TypeScript 5
- Ant Design Vue 4
- Pinia 2
- Vue Router 4
- Vite 5
- ECharts 5
- VxeTable 4
- Axios
- TailwindCSS 3

**部署：**
- Docker
- Docker Compose
- Nginx
- PM2
- Let's Encrypt

### 9.2 参考文档

- [NestJS官方文档](https://docs.nestjs.com/)
- [Vue 3官方文档](https://vuejs.org/)
- [Ant Design Vue文档](https://antdv.com/)
- [TypeORM文档](https://typeorm.io/)
- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [支付宝小程序文档](https://opendocs.alipay.com/mini)

### 9.3 版本历史

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-04-29 | 初始版本 | 策衡 |

---

**文档状态：** 已完成  
**下一步行动：** 进入第0阶段准备工作
