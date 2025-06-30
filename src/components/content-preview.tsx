"use client";

import { useState, useMemo, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Markdown } from "./markdown";
import DOMPurify from "dompurify";
import { Eye, Edit, Copy, Download } from "lucide-react";
import { useCopy } from "@/hooks/use-copy";
import { toast } from "sonner";

export interface ContentPreviewProps {
  initialContent?: string;
  contentType?: "markdown" | "html" | "auto";
  placeholder?: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
  className?: string;
}

const detectContentType = (content: string): "markdown" | "html" => {
  const htmlPattern = /<[^>]+>/;
  const markdownPattern =
    /^#{1,6}\s|^\*\*|^\*(?!\*)|^\-\s|^\d+\.\s|^\[.*\]\(.*\)|^`{3}|^>/m;

  if (htmlPattern.test(content)) {
    return "html";
  }
  if (markdownPattern.test(content)) {
    return "markdown";
  }

  return content.includes("**") ||
    content.includes("*") ||
    content.includes("#")
    ? "markdown"
    : "html";
};

const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "del",
      "ins",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "a",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "div",
      "span",
      "hr",
    ],
    ALLOWED_ATTR: [
      "href",
      "target",
      "rel",
      "src",
      "alt",
      "title",
      "width",
      "height",
      "class",
      "id",
      "style",
    ],
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ["script", "object", "embed", "form", "input", "button"],
    FORBID_ATTR: [
      "onclick",
      "onerror",
      "onload",
      "onmouseover",
      "onfocus",
      "onblur",
    ],
  });
};

export function ContentPreview({
  initialContent = "",
  contentType = "auto",
  placeholder = "输入 HTML 或 Markdown 内容...",
  onChange,
  readOnly = false,
  className = "",
}: ContentPreviewProps) {
  const [content, setContent] = useState(initialContent);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const { copy } = useCopy();

  const detectedType = useMemo(() => {
    if (contentType === "auto") {
      return detectContentType(content);
    }
    return contentType;
  }, [content, contentType]);

  const renderedContent = useMemo(() => {
    if (!content.trim()) return "";

    if (detectedType === "html") {
      return sanitizeHtml(content);
    }

    return content;
  }, [content, detectedType]);

  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      onChange?.(newContent);
    },
    [onChange],
  );

  const handleCopy = useCallback(() => {
    copy(content);
    toast.success("内容已复制到剪贴板");
  }, [copy, content]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content.${detectedType === "html" ? "html" : "md"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content, detectedType]);

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "edit" | "preview")}
        className="flex-1"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              编辑 ({detectedType.toUpperCase()})
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              预览
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!content.trim()}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!content.trim()}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="edit" className="flex-1 m-0">
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full min-h-[400px] resize-none font-mono text-sm"
            readOnly={readOnly}
          />
        </TabsContent>

        <TabsContent value="preview" className="flex-1 m-0">
          <div className="w-full h-full min-h-[400px] border rounded-md p-4 bg-background overflow-auto">
            {!renderedContent ? (
              <div className="text-muted-foreground text-center py-8">
                暂无内容可预览
              </div>
            ) : detectedType === "html" ? (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: renderedContent }}
              />
            ) : (
              <Markdown>{renderedContent}</Markdown>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
