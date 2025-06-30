"use client";

import { ContentPreview } from "@/components/content-preview";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const sampleMarkdown = `# Markdown 预览示例

这是一个 **Markdown** 预览功能的演示页面。

## 功能特性

- ✅ 实时预览
- ✅ 语法安全过滤
- ✅ 自动格式检测
- ✅ 复制和下载功能

### 代码块支持

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### 列表支持

1. 有序列表项 1
2. 有序列表项 2
   - 无序子项
   - 另一个子项

### 引用块

> 这是一个引用块示例
> 支持多行内容

### 链接和图片

[访问 GitHub](https://github.com)

### 表格

| 功能 | 状态 | 说明 |
|------|------|------|
| Markdown 渲染 | ✅ | 完全支持 |
| HTML 渲染 | ✅ | 安全过滤 |
| 实时预览 | ✅ | 即时更新 |
`;

const sampleHtml = `<div>
  <h1>HTML 预览示例</h1>
  
  <p>这是一个 <strong>HTML</strong> 预览功能的演示。</p>
  
  <h2>支持的标签</h2>
  
  <ul>
    <li>标题标签：<code>h1-h6</code></li>
    <li>段落标签：<code>p</code></li>
    <li>强调标签：<code>strong</code>, <code>em</code></li>
    <li>列表标签：<code>ul</code>, <code>ol</code>, <code>li</code></li>
    <li>链接标签：<code>a</code></li>
  </ul>
  
  <blockquote>
    <p>这是一个引用块，通过 DOMPurify 进行安全过滤。</p>
  </blockquote>
  
  <h3>安全防护</h3>
  
  <p>所有危险的标签和属性都会被自动过滤：</p>
  
  <pre><code>&lt;script&gt;alert('xss')&lt;/script&gt; // 这会被过滤掉
&lt;img src="x" onerror="alert('xss')"&gt; // 事件处理器会被移除</code></pre>
  
  <p>链接示例：<a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a></p>
</div>`;

export default function PreviewTestPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">内容预览功能测试</h1>
        <p className="text-muted-foreground">
          测试 HTML 和 Markdown 内容的实时预览功能
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Markdown 预览</CardTitle>
            <CardDescription>
              支持 GitHub Flavored Markdown 语法
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContentPreview
              initialContent={sampleMarkdown}
              contentType="markdown"
              placeholder="输入 Markdown 内容..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>HTML 预览</CardTitle>
            <CardDescription>
              安全的 HTML 渲染，自动过滤危险内容
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContentPreview
              initialContent={sampleHtml}
              contentType="html"
              placeholder="输入 HTML 内容..."
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>自动检测模式</CardTitle>
          <CardDescription>
            自动检测内容类型并选择合适的渲染方式
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContentPreview
            contentType="auto"
            placeholder="输入 HTML 或 Markdown 内容，系统会自动检测类型..."
          />
        </CardContent>
      </Card>

      <div className="space-y-4 p-6 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold">功能说明</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-medium mb-2">安全特性</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• 使用 DOMPurify 进行 XSS 防护</li>
              <li>• 白名单机制过滤危险标签</li>
              <li>• 移除所有事件处理器属性</li>
              <li>• URL 安全验证</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">用户体验</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• 实时预览更新</li>
              <li>• 自动内容类型检测</li>
              <li>• 一键复制和下载</li>
              <li>• 响应式设计</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
