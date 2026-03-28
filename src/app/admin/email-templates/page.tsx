"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Button, Input } from "@/components/ui";
import {
  NOTIFICATION_TEMPLATES,
  type NotificationTemplate,
} from "@/lib/notifications/templates";
import {
  TEMPLATE_SAMPLE_DATA,
  getTemplateVariables,
  renderEmailTemplate,
} from "@/lib/email/renderer";
import {
  Mail,
  MessageSquare,
  Globe,
  Eye,
  Code,
  Send,
  Loader2,
  Check,
  Copy,
  Search,
  ChevronRight,
  ArrowLeft,
  Variable,
  Palette,
} from "lucide-react";

interface TemplateEntry {
  key: string;
  template: NotificationTemplate;
  variables: string[];
  sampleData: Record<string, string>;
}

const CHANNEL_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  email: {
    label: "Email",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    icon: Mail,
  },
  sms: {
    label: "SMS",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    icon: MessageSquare,
  },
  web: {
    label: "Web",
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
    icon: Globe,
  },
};

function formatTemplateName(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function highlightVariables(text: string): React.ReactNode[] {
  const parts = text.split(/(\{\{\w+\}\})/g);
  return parts.map((part, i) => {
    if (/^\{\{\w+\}\}$/.test(part)) {
      return (
        <span
          key={i}
          className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-mono font-semibold"
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function EmailTemplatesPage() {
  const supabase = createClient();

  const [templates, setTemplates] = useState<TemplateEntry[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateEntry | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
  const [previewHtml, setPreviewHtml] = useState("");
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  // Custom variable values for preview
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});

  useEffect(() => {
    const entries: TemplateEntry[] = Object.entries(NOTIFICATION_TEMPLATES).map(
      ([key, template]) => ({
        key,
        template,
        variables: getTemplateVariables(key),
        sampleData: TEMPLATE_SAMPLE_DATA[key] || {},
      })
    );
    setTemplates(entries);
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      const mergedVars = {
        ...selectedTemplate.sampleData,
        ...customVariables,
      };
      try {
        const rendered = renderEmailTemplate(selectedTemplate.key, mergedVars);
        setPreviewHtml(rendered.html);
      } catch {
        setPreviewHtml("<p>Error rendering template</p>");
      }
    }
  }, [selectedTemplate, customVariables]);

  const handleSelectTemplate = (entry: TemplateEntry) => {
    setSelectedTemplate(entry);
    setViewMode("preview");
    setCustomVariables({});
    setTestSent(false);
  };

  const handleSendTest = async () => {
    if (!selectedTemplate) return;
    setIsSendingTest(true);
    setTestSent(false);

    try {
      const res = await fetch("/api/email/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: selectedTemplate.key }),
      });
      const data = await res.json();
      if (data.success) {
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
      }
    } catch (err) {
      console.error("Failed to send test:", err);
    }
    setIsSendingTest(false);
  };

  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    setCopiedVariable(variable);
    setTimeout(() => setCopiedVariable(null), 1500);
  };

  const filteredTemplates = templates.filter((entry) => {
    const matchesSearch =
      !search ||
      entry.key.toLowerCase().includes(search.toLowerCase()) ||
      entry.template.subject.toLowerCase().includes(search.toLowerCase());
    const matchesChannel =
      channelFilter === "all" || entry.template.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
        <p className="text-gray-500 mt-1">
          Preview and test transactional email templates
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-250px)]">
        {/* Template List (Left Panel) */}
        <div
          className={`${selectedTemplate ? "hidden lg:block" : ""} lg:w-[380px] flex-shrink-0 space-y-4`}
        >
          {/* Filters */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none"
              aria-label="Filter by channel"
            >
              <option value="all">All</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="web">Web</option>
            </select>
          </div>

          {/* Template Cards */}
          <div className="space-y-2">
            {filteredTemplates.length === 0 ? (
              <Card className="text-center py-12">
                <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No templates match your filter</p>
              </Card>
            ) : (
              filteredTemplates.map((entry) => {
                const channelCfg = CHANNEL_CONFIG[entry.template.channel];
                const ChannelIcon = channelCfg?.icon || Mail;
                const isSelected = selectedTemplate?.key === entry.key;

                return (
                  <button
                    key={entry.key}
                    onClick={() => handleSelectTemplate(entry)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      isSelected
                        ? "border-aura-primary bg-aura-primary/5 ring-1 ring-aura-primary/20"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${channelCfg?.bgColor || ""} ${channelCfg?.color || ""}`}
                          >
                            <ChannelIcon className="w-3 h-3" />
                            {channelCfg?.label || entry.template.channel}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {formatTemplateName(entry.key)}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {entry.template.subject || "(No subject)"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {entry.template.body.slice(0, 100)}...
                        </p>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 flex-shrink-0 mt-1 ${isSelected ? "text-aura-primary" : "text-gray-300"}`}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Template Detail (Right Panel) */}
        {selectedTemplate ? (
          <div className="flex-1 min-w-0 space-y-4">
            {/* Mobile back button */}
            <button
              onClick={() => setSelectedTemplate(null)}
              className="lg:hidden inline-flex items-center gap-1 text-sm text-gray-500 hover:text-aura-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to templates
            </button>

            {/* Template Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {formatTemplateName(selectedTemplate.key)}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Subject:{" "}
                  <span className="font-medium text-gray-700">
                    {selectedTemplate.template.subject || "(No subject - SMS)"}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      viewMode === "preview"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => setViewMode("raw")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      viewMode === "raw"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    Raw
                  </button>
                </div>
                <Button
                  size="sm"
                  variant={testSent ? "primary" : "outline"}
                  onClick={handleSendTest}
                  isLoading={isSendingTest}
                  leftIcon={
                    testSent ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {testSent ? "Sent" : "Send Test"}
                </Button>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-4">
              {/* Preview / Raw Area */}
              <div className="flex-1 min-w-0">
                {viewMode === "preview" ? (
                  <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-100">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                      <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-400" />
                        <span className="w-3 h-3 rounded-full bg-yellow-400" />
                        <span className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <span className="text-xs text-gray-400 font-mono ml-2">
                        Email Preview
                      </span>
                    </div>
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full bg-white border-0"
                      style={{ minHeight: "600px" }}
                      title="Email preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                        Subject
                      </label>
                      <div className="p-3 bg-white border border-gray-200 rounded-xl font-mono text-sm text-gray-800 leading-relaxed">
                        {highlightVariables(
                          selectedTemplate.template.subject || "(No subject)"
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                        Body Template
                      </label>
                      <div className="p-4 bg-gray-900 border border-gray-700 rounded-xl font-mono text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {selectedTemplate.template.body
                          .split(/(\{\{\w+\}\})/g)
                          .map((part, i) => {
                            if (/^\{\{\w+\}\}$/.test(part)) {
                              return (
                                <span
                                  key={i}
                                  className="text-emerald-400 font-semibold"
                                >
                                  {part}
                                </span>
                              );
                            }
                            return <span key={i}>{part}</span>;
                          })}
                      </div>
                    </div>

                    {/* Channel Info */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                        Channel
                      </label>
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm">
                        {(() => {
                          const cfg =
                            CHANNEL_CONFIG[selectedTemplate.template.channel];
                          const Icon = cfg?.icon || Mail;
                          return (
                            <span
                              className={`flex items-center gap-1.5 ${cfg?.color || ""}`}
                            >
                              <Icon className="w-4 h-4" />
                              {cfg?.label || selectedTemplate.template.channel}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Variables Panel */}
              <div className="xl:w-72 flex-shrink-0">
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden sticky top-4">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Variable className="w-4 h-4 text-gray-400" />
                      Template Variables
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {selectedTemplate.variables.length === 0 ? (
                      <p className="text-sm text-gray-400">
                        No variables in this template
                      </p>
                    ) : (
                      selectedTemplate.variables.map((variable) => (
                        <div key={variable} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => handleCopyVariable(variable)}
                              className="flex items-center gap-1.5 text-xs font-mono text-emerald-700 bg-emerald-50 rounded px-2 py-1 hover:bg-emerald-100 transition-colors"
                              title="Copy to clipboard"
                            >
                              {`{{${variable}}}`}
                              {copiedVariable === variable ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-50" />
                              )}
                            </button>
                          </div>
                          <input
                            type="text"
                            value={
                              customVariables[variable] ??
                              selectedTemplate.sampleData[variable] ??
                              ""
                            }
                            onChange={(e) =>
                              setCustomVariables({
                                ...customVariables,
                                [variable]: e.target.value,
                              })
                            }
                            placeholder={
                              selectedTemplate.sampleData[variable] ||
                              `Enter ${variable}`
                            }
                            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none"
                          />
                        </div>
                      ))
                    )}
                  </div>

                  {/* Sample Data Info */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" />
                      Edit values above to update the preview
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div className="text-center">
              <Mail className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-1">
                Select a template
              </h3>
              <p className="text-sm text-gray-400">
                Choose a template from the left to preview and test
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
