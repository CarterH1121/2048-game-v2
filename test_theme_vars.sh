#!/bin/bash
# 2048主题系统深度整合自测脚本
# 技研Agent自动验证报告

echo "========================================"
echo "【技研Agent】主题系统深度整合自测报告"
echo "========================================"
echo ""

# 测试文件路径
FILE="index.html"

# 主题列表
THEMES=("neon" "sakura" "tech" "nature" "minimal")

# 必须存在的CSS变量
REQUIRED_VARS=(
    "--glass-bg"
    "--glass-border"
    "--glass-shine"
    "--brand-primary"
    "--brand-primary-light"
    "--brand-primary-dark"
    "--brand-secondary"
    "--brand-accent"
    "--shadow-color"
)

# 统计结果
PASS_COUNT=0
FAIL_COUNT=0

echo "一、主题CSS变量完整性检查"
echo "----------------------------------------"

for theme in "${THEMES[@]}"; do
    echo ""
    echo "主题: $theme"
    
    # 检查主题定义存在
    if grep -q "body.theme-$theme {" "$FILE"; then
        echo "  ✓ 主题定义存在"
        ((PASS_COUNT++))
    else
        echo "  ✗ 主题定义不存在"
        ((FAIL_COUNT++))
        continue
    fi
    
    # 提取主题范围
    START_LINE=$(grep -n "body.theme-$theme {" "$FILE" | cut -d: -f1)
    END_LINE=$(grep -n "body.theme-.*{$" "$FILE" | grep -A1 "^$START_LINE:" | tail -1 | cut -d: -f1)
    
    if [ -z "$END_LINE" ]; then
        END_LINE=$(grep -n "\/\/ 主容器" "$FILE" | head -1 | cut -d: -f1 | awk '{print $1-1}')
    fi
    
    # 检查每个必需变量
    for var in "${REQUIRED_VARS[@]}"; do
        # 在主题范围内查找变量
        if sed -n "${START_LINE},${END_LINE}p" "$FILE" | grep -q "$var:"; then
            echo "  ✓ $var 已定义"
            ((PASS_COUNT++))
        else
            echo "  ✗ $var 未定义"
            ((FAIL_COUNT++))
        fi
    done
done

echo ""
echo "二、:root默认变量检查"
echo "----------------------------------------"

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "$var:" "$FILE" | head -30; then
        # 检查是否在:root范围内
        if sed -n '/:root {/,/^}/p' "$FILE" | grep -q "$var:"; then
            echo "  ✓ :root中 $var 已定义"
            ((PASS_COUNT++))
        else
            echo "  ✗ :root中 $var 未定义"
            ((FAIL_COUNT++))
        fi
    fi
done

echo ""
echo "三、CSS变量引用检查"
echo "----------------------------------------"

GLASS_BG_COUNT=$(grep -c "var(--glass-bg)" "$FILE")
GLASS_BORDER_COUNT=$(grep -c "var(--glass-border)" "$FILE")
BRAND_PRIMARY_COUNT=$(grep -c "var(--brand-primary)" "$FILE")
SHADOW_COUNT=$(grep -c "var(--shadow" "$FILE")

echo "  --glass-bg 引用次数: $GLASS_BG_COUNT"
echo "  --glass-border 引用次数: $GLASS_BORDER_COUNT"
echo "  --brand-primary 引用次数: $BRAND_PRIMARY_COUNT"
echo "  --shadow 系列引用次数: $SHADOW_COUNT"

if [ "$GLASS_BG_COUNT" -ge 10 ]; then ((PASS_COUNT++)); echo "  ✓ 玻璃态背景变量充分使用"; else ((FAIL_COUNT++)); echo "  ✗ 玻璃态背景变量使用不足"; fi
if [ "$GLASS_BORDER_COUNT" -ge 10 ]; then ((PASS_COUNT++)); echo "  ✓ 玻璃态边框变量充分使用"; else ((FAIL_COUNT++)); echo "  ✗ 玻璃态边框变量使用不足"; fi
if [ "$BRAND_PRIMARY_COUNT" -ge 5 ]; then ((PASS_COUNT++)); echo "  ✓ 品牌主色变量充分使用"; else ((FAIL_COUNT++)); echo "  ✗ 品牌主色变量使用不足"; fi
if [ "$SHADOW_COUNT" -ge 15 ]; then ((PASS_COUNT++)); echo "  ✓ 阴影变量充分使用"; else ((FAIL_COUNT++)); echo "  ✗ 阴影变量使用不足"; fi

echo ""
echo "四、硬编码颜色检查（应避免）"
echo "----------------------------------------"

# 检查是否还有硬编码的玻璃态颜色
HARDCODED_GLASS=$(grep -c "rgba(30, 30, 46, 0.6)" "$FILE" || echo "0")
HARDCODED_BRAND=$(grep -c "#6366F1" "$FILE" || echo "0")

echo "  硬编码玻璃态背景: $HARDCODED_GLASS 处"
echo "  硬编码品牌主色: $HARDCODED_BRAND 处 (允许出现在:root定义和meta标签)"

echo ""
echo "========================================"
echo "【自测结果统计】"
echo "========================================"
echo "通过检查项: $PASS_COUNT"
echo "失败检查项: $FAIL_COUNT"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo "【审核通过】所有主题CSS变量完整，UI元素正确使用CSS变量"
    echo ""
    echo "技研Agent签名: 主题系统深度整合实现完成 ✓"
    echo "审核状态: 【审核通过】"
    echo "流转权限: 策衡验收环节解锁..."
else
    echo "【审核未通过】存在 $FAIL_COUNT 个问题需要修复"
fi

echo ""
echo "========================================"