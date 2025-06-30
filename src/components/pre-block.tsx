"use client";

import type { JSX } from "react";
import {
  bundledLanguages,
  codeToHast,
  type BundledLanguage,
} from "shiki/bundle/web";
import { Fragment, useLayoutEffect, useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { safe } from "ts-safe";
import { cn } from "lib/utils";
import { useTheme } from "next-themes";
import { Button } from "ui/button";
import { Clipboard, CheckIcon, Code, Eye } from "lucide-react";
import JsonView from "ui/json-view";
import { useCopy } from "@/hooks/use-copy";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Markdown } from "./markdown";
import DOMPurify from "dompurify";
import dynamic from "next/dynamic";

// Dynamically import MermaidDiagram component
const MermaidDiagram = dynamic(
  () => import("./mermaid-diagram").then((mod) => mod.MermaidDiagram),
  {
    loading: () => (
      <div className="text-sm flex bg-accent/30 flex-col rounded-2xl relative my-4 overflow-hidden border">
        <div className="w-full flex z-20 py-2 px-4 items-center">
          <span className="text-sm text-muted-foreground">mermaid</span>
        </div>
        <div className="relative overflow-x-auto px-6 pb-6">
          <div className="h-20 w-full flex items-center justify-center">
            <span className="text-muted-foreground">
              Loading Mermaid renderer...
            </span>
          </div>
        </div>
      </div>
    ),
    ssr: false,
  },
);

const PurePre = ({
  children,
  className,
  code,
  lang,
}: {
  children: any;
  className?: string;
  code: string;
  lang: string;
}) => {
  const { copied, copy } = useCopy();

  return (
    <pre className={cn("relative ", className)}>
      <div className="w-full flex z-20 py-2 px-4 items-center">
        <span className="text-sm text-muted-foreground">{lang}</span>
        <Button
          size="icon"
          variant={copied ? "secondary" : "ghost"}
          className="ml-auto z-10 p-3! size-2! rounded-sm"
          onClick={() => {
            copy(code);
          }}
        >
          {copied ? <CheckIcon /> : <Clipboard className="size-3!" />}
        </Button>
      </div>
      <div className="relative overflow-x-auto px-6 pb-6">{children}</div>
    </pre>
  );
};

const PreviewablePre = ({
  children,
  className,
  code,
  lang,
}: {
  children: any;
  className?: string;
  code: string;
  lang: string;
}) => {
  const { copied, copy } = useCopy();
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");

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

  const renderPreview = () => {
    if (lang === "html") {
      const sanitizedHtml = sanitizeHtml(code);
      return (
        <div
          className="prose prose-sm max-w-none dark:prose-invert p-4"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      );
    } else if (lang === "markdown" || lang === "md") {
      return (
        <div className="p-4">
          <Markdown>{code}</Markdown>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("relative ", className)}>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "code" | "preview")}
      >
        <div className="w-full flex z-20 py-2 px-4 items-center border-b border-border/50">
          <TabsList className="h-7 p-0.5">
            <TabsTrigger
              value="code"
              className="h-6 px-2 text-xs flex items-center gap-1"
            >
              <Code className="w-3 h-3" />
              Code
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="h-6 px-2 text-xs flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              Preview
            </TabsTrigger>
          </TabsList>
          <span className="text-sm text-muted-foreground ml-2">{lang}</span>
          <Button
            size="icon"
            variant={copied ? "secondary" : "ghost"}
            className="ml-auto z-10 p-3! size-2! rounded-sm"
            onClick={() => {
              copy(code);
            }}
          >
            {copied ? <CheckIcon /> : <Clipboard className="size-3!" />}
          </Button>
        </div>

        <TabsContent value="code" className="m-0">
          <div className="relative overflow-x-auto px-6 pb-6 pt-4">
            {children}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className="relative overflow-x-auto">{renderPreview()}</div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export async function highlight(
  code: string,
  lang: BundledLanguage | (string & {}),
  theme: string,
) {
  const parsed: BundledLanguage = (
    bundledLanguages[lang] ? lang : "md"
  ) as BundledLanguage;

  if (lang === "json") {
    return (
      <PurePre code={code} lang={lang}>
        <JsonView data={code} initialExpandDepth={3} />
      </PurePre>
    );
  }

  if (lang === "mermaid") {
    return (
      <PurePre code={code} lang={lang}>
        <MermaidDiagram chart={code} />
      </PurePre>
    );
  }

  // For HTML and Markdown, use PreviewablePre with tabs
  if (lang === "html" || lang === "markdown" || lang === "md") {
    const out = await codeToHast(code, {
      lang: parsed,
      theme,
    });

    const codeElement = toJsxRuntime(out, {
      Fragment,
      jsx,
      jsxs,
      components: {
        pre: (props) => <div {...props} />, // Remove the default pre wrapper
      },
    }) as JSX.Element;

    return (
      <PreviewablePre code={code} lang={lang}>
        {codeElement}
      </PreviewablePre>
    );
  }

  const out = await codeToHast(code, {
    lang: parsed,
    theme,
  });

  return toJsxRuntime(out, {
    Fragment,
    jsx,
    jsxs,
    components: {
      pre: (props) => <PurePre {...props} code={code} lang={lang} />,
    },
  }) as JSX.Element;
}

export function PreBlock({ children }: { children: any }) {
  const code = children.props.children;
  const { theme } = useTheme();
  const language = children.props.className?.split("-")?.[1] || "bash";
  const [loading, setLoading] = useState(true);
  const [component, setComponent] = useState<JSX.Element | null>(
    <PurePre className="animate-pulse" code={code} lang={language}>
      {children}
    </PurePre>,
  );
  const themeSystem = useMemo(() => {
    return theme?.endsWith("-dark") ? "dark" : "default";
  }, [theme]);

  useLayoutEffect(() => {
    safe()
      .map(() =>
        highlight(
          code,
          language,
          themeSystem === "dark" ? "dark-plus" : "github-light",
        ),
      )
      .ifOk(setComponent)
      .watch(() => setLoading(false));
  }, [themeSystem, language, code]);

  // For other code blocks, render as before
  return (
    <div
      className={cn(
        loading && "animate-pulse",
        "text-sm flex bg-accent/30 flex-col rounded-2xl relative my-4 overflow-hidden border",
      )}
    >
      {component}
    </div>
  );
}
