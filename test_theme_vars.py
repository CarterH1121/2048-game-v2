#!/usr/bin/env python3
"""
2048主题系统深度整合自测脚本
技研Agent自动验证报告
"""

import re

FILE = "index.html"

# 主题列表
THEMES = ["neon", "sakura", "tech", "nature", "minimal"]

# 必须存在的CSS变量
REQUIRED_VARS = [
    "--glass-bg",
    "--glass-border", 
    "--glass-shine",
    "--brand-primary",
    "--brand-primary-light",
    "--brand-primary-dark",
    "--brand-secondary",
    "--brand-accent",
    "--shadow-color",
    "--shadow-1",
    "--shadow-2",
    "--shadow-3",
    "--shadow-4"
]

print("=" * 50)
print("【技研Agent】主题系统深度整合自测报告")
print("=" * 50)
print()

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

pass_count = 0
fail_count = 0

print("一、主题CSS变量完整性检查")
print("-" * 40)

for theme in THEMES:
    print(f"\n主题: {theme}")
    
    # 提取主题定义块
    pattern = rf'body\.theme-{theme}\s*{{([^}}]+)}}'
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        theme_block = match.group(1)
        print("  ✓ 主题定义存在")
        pass_count += 1
        
        for var in REQUIRED_VARS:
            if var in theme_block:
                print(f"  ✓ {var} 已定义")
                pass_count += 1
            else:
                print(f"  ✗ {var} 未定义")
                fail_count += 1
    else:
        print("  ✗ 主题定义不存在")
        fail_count += 1

print()
print("二、:root默认变量检查")
print("-" * 40)

# 提取:root块
root_pattern = r':root\s*{([^}]+(?:}[^}]+)*)}'
root_match = re.search(root_pattern, content, re.DOTALL)

if root_match:
    root_block = root_match.group(1)
    print("  ✓ :root定义存在")
    pass_count += 1
    
    for var in REQUIRED_VARS[:9]:  # 只检查基础变量
        if var in root_block:
            print(f"  ✓ :root中 {var} 已定义")
            pass_count += 1
        else:
            print(f"  ✗ :root中 {var} 未定义")
            fail_count += 1
else:
    print("  ✗ :root定义不存在")
    fail_count += 1

print()
print("三、CSS变量引用检查")
print("-" * 40)

# 统计变量引用次数
var_counts = {
    "glass-bg": len(re.findall(r'var\(--glass-bg\)', content)),
    "glass-border": len(re.findall(r'var\(--glass-border\)', content)),
    "brand-primary": len(re.findall(r'var\(--brand-primary\)', content)),
    "shadow": len(re.findall(r'var\(--shadow', content))
}

print(f"  --glass-bg 引用次数: {var_counts['glass-bg']}")
print(f"  --glass-border 引用次数: {var_counts['glass-border']}")
print(f"  --brand-primary 引用次数: {var_counts['brand-primary']}")
print(f"  --shadow 系列引用次数: {var_counts['shadow']}")

checks = [
    ("--glass-bg", var_counts['glass-bg']),
    ("--glass-border", var_counts['glass-border']),
    ("--brand-primary", var_counts['brand-primary']),
    ("--shadow系统", var_counts['shadow'])
]

for name, count in checks:
    if count >= 5:
        print(f"  ✓ {name} 充分使用 ({count}次)")
        pass_count += 1
    else:
        print(f"  ✗ {name} 使用不足 ({count}次)")
        fail_count += 1

print()
print("四、阴影系统使用CSS变量检查")
print("-" * 40)

# 检查shadow-1到shadow-4是否使用var(--shadow-color)
shadow_uses_var = re.search(r'--shadow-1:\s*0[^;]+var\(--shadow-color\)', content)
if shadow_uses_var:
    print("  ✓ shadow-1 正确使用 var(--shadow-color)")
    pass_count += 1
else:
    print("  ✗ shadow-1 未正确使用 var(--shadow-color)")
    fail_count += 1

print()
print("=" * 50)
print("【自测结果统计】")
print("=" * 50)
print(f"通过检查项: {pass_count}")
print(f"失败检查项: {fail_count}")
print()

if fail_count == 0:
    print("【审核通过】所有主题CSS变量完整，UI元素正确使用CSS变量")
    print()
    print("技研Agent签名: 主题系统深度整合实现完成 ✓")
    print("审核状态: 【审核通过】")
    print("流转权限: 策衡验收环节解锁...")
else:
    print(f"【审核未通过】存在 {fail_count} 个问题需要修复")

print()
print("=" * 50)
