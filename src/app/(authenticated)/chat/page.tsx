"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";
import { Copy, ExternalLink, Link2, Loader2, Paperclip, Plus, Search, Send, X, PanelLeft, Edit2, Check, Upload } from "lucide-react";

type MessageRole = "user" | "assistant";

type Citation = {
  id: string;
  title: string;
  url?: string;
  snippet?: string;
};

type MessageStatus = "sending" | "sent" | "failed" | "responding";

type Message = {
  id: string;
  role: MessageRole;
  content: string; // may include Markdown + LaTeX ($...$ or $$...$$)
  citations?: Citation[];
  createdAt?: number; // epoch ms
  status?: MessageStatus;
  editedAt?: number; // epoch ms
  isEditing?: boolean;
};

const mockSubjects = [
  { id: "all", name: "All subjects" },
  { id: "cs101", name: "CS101" },
  { id: "math201", name: "MATH201" },
  { id: "eng310", name: "ENG310" },
];

const mockMessages: Message[] = [
  {
    id: "m1",
    role: "assistant",
    content: "Hello! Ask me anything about your subjects.",
    createdAt: Date.now() - 1000 * 60 * 3,
    status: "sent",
  },
  {
    id: "m2",
    role: "user",
    content: "Summarize the sorting algorithms covered in CS101 and show a code sample.",
    createdAt: Date.now() - 1000 * 60 * 2,
    status: "sent",
  },
  {
    id: "m3",
    role: "assistant",
    content:
      "Here are the main sorting algorithms from CS101:\n\n**QuickSort** - O(n log n) average, O(n²) worst case\n**MergeSort** - O(n log n) guaranteed, stable\n**HeapSort** - O(n log n) always, in-place\n\nEach has different trade-offs for space, stability, and performance. Need more details on any specific algorithm?",
    citations: [
      {
        id: "c1",
        title: "CLRS 4th Ed. - Sorting",
        url: "https://example.com/clrs-sorting",
        snippet: "Divide-and-conquer approaches to sorting are efficient in practice.",
      },
      {
        id: "c2",
        title: "Course Notes - CS101 Week 5",
        snippet: "Proof sketch of average-case complexity for QuickSort.",
      },
    ],
    createdAt: Date.now() - 1000 * 60 * 1,
    status: "sent",
  },
];

type UploadItem = {
  id: string;
  name: string;
  progress: number; // 0-100
  status: "uploading" | "done" | "error";
};

function useAutoScroll(deps: unknown[]) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}

function usePrismHighlighting() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasPrism = (window as any).Prism;
    if (!hasPrism) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism.min.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/prismjs@1/prism.min.js";
      script.async = true;
      script.onload = () => {
        const langScript = document.createElement("script");
        langScript.src = "https://cdn.jsdelivr.net/npm/prismjs@1/components/prism-typescript.min.js";
        langScript.async = true;
        document.body.appendChild(langScript);
      };
      document.body.appendChild(script);
    } else {
      try {
        (window as any).Prism?.highlightAll?.();
      } catch {}
    }
  }, []);
}

function useKatex() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const katexCss = document.createElement("link");
    katexCss.rel = "stylesheet";
    katexCss.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
    document.head.appendChild(katexCss);

    const renderScript = document.createElement("script");
    renderScript.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js";
    renderScript.async = true;
    renderScript.onload = () => {
      try {
        (window as any).renderMathInElement?.(document.body, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ],
        });
      } catch {}
    };
    document.body.appendChild(renderScript);
  }, []);
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      className={cn("h-7 w-7", className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
    >
      <Copy className="h-4 w-4" />
    </Button>
  );
}

function formatTime(ts?: number) {
  if (!ts) return "";
  const d = new Date(ts);
  const hh = `${d.getHours()}`.padStart(2, "0");
  const mm = `${d.getMinutes()}`.padStart(2, "0");
  return `${hh}:${mm}`;
}

function MessageBubble({ 
  message, 
  onRetry, 
  onEdit, 
  onSaveEdit, 
  onCancelEdit
}: { 
  message: Message; 
  onRetry?: (id: string) => void;
  onEdit?: (id: string) => void;
  onSaveEdit?: (id: string, newContent: string) => void;
  onCancelEdit?: (id: string) => void;
}) {
  const [editContent, setEditContent] = useState(message.content);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    try {
      (window as any).Prism?.highlightAll?.();
    } catch {}
  }, [message.content]);

  useEffect(() => {
    setEditContent(message.content);
  }, [message.content]);

  const isUser = message.role === "user";
  const timeString = formatTime(message.createdAt);
  const editedTimeString = message.editedAt ? formatTime(message.editedAt) : null;

  const handleSaveEdit = () => {
    if (onSaveEdit && editContent.trim() !== message.content) {
      onSaveEdit(message.id, editContent.trim());
    } else if (onCancelEdit) {
      onCancelEdit(message.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      if (onCancelEdit) onCancelEdit(message.id);
    }
  };

  return (
    <div
      className={cn(
        "flex w-full gap-3 items-start group",
        isUser ? "justify-end" : "justify-start"
      )}
      role="listitem"
      aria-label={isUser ? "User message" : "Assistant message"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn("max-w-[80%] sm:max-w-[70%] lg:max-w-[55%] inline-block relative", isUser ? "order-2 pb-8" : "order-1")}> 
        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className={cn(
                isUser ? "bg-primary text-primary-foreground" : "bg-card", 
                "shadow-sm w-fit max-w-full p-0 transition-all duration-300",
                message.status === "sending" && "animate-pulse",
                message.status === "failed" && "animate-bounce",
                message.status === "responding" && "animate-pulse",
                message.isEditing && "ring-2 ring-blue-500",
                // Dynamic vibration effect for new messages (only for user messages)
                message.status === "sent" && message.role === "user" && message.createdAt && (Date.now() - message.createdAt) < 2000 && "animate-pulse"
              )}> 
                <CardContent className="p-2 sm:p-3 text-sm leading-relaxed">
                  {message.isEditing ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="min-h-[100px] resize-none"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleSaveEdit} className="h-8">
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onCancelEdit?.(message.id)} className="h-8">
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {message.status === "responding" ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                          </div>
                          <span className="text-sm">Thinking...</span>
                        </div>
                      ) : (
                        <div className="space-y-3 break-words whitespace-pre-wrap">
                          {renderContentWithCode(message.content)}
                        </div>
                      )}
                      {message.citations && message.citations.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Drawer>
                            <DrawerTrigger asChild>
                              <Button size="sm" variant={isUser ? "secondary" : "outline"} aria-label="View citations">
                                <Link2 className="mr-2 h-4 w-4" /> Citations ({message.citations.length})
                              </Button>
                            </DrawerTrigger>
                            <DrawerContent className="max-h-[85vh]">
                              <DrawerHeader>
                                <DrawerTitle>Citations</DrawerTitle>
                              </DrawerHeader>
                              <div className="px-6 pb-6 space-y-4 overflow-y-auto">
                                {message.citations.map((c) => (
                                  <div key={c.id} className="rounded-md border p-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="font-medium">{c.title}</div>
                                      {c.url && (
                                        <Link href={c.url} target="_blank" aria-label="Open source">
                                          <Button variant="ghost" size="icon">
                                            <ExternalLink className="h-4 w-4" />
                                          </Button>
                                        </Link>
                                      )}
                                    </div>
                                    {c.snippet && <p className="mt-2 text-sm text-muted-foreground">{c.snippet}</p>}
                                  </div>
                                ))}
                                <div className="pt-2">
                                  <DrawerClose asChild>
                                    <Button variant="secondary" className="w-full">Close</Button>
                                  </DrawerClose>
                                </div>
                              </div>
                            </DrawerContent>
                          </Drawer>
                        </div>
                      )}

                      {/* Status badges */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {message.status === "sending" && (
                          <Badge variant={isUser ? "secondary" : "outline"}>Sending…</Badge>
                        )}
                        {message.status === "responding" && (
                          <Badge variant="outline" className="text-xs">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Responding...
                          </Badge>
                        )}
                        {message.status === "failed" && (
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">Failed</Badge>
                            {onRetry && (
                              <Button size="sm" variant={isUser ? "secondary" : "outline"} onClick={() => onRetry(message.id)}>Retry</Button>
                            )}
                          </div>
                        )}
                        {message.editedAt && (
                          <Badge variant="outline" className="text-xs">
                            Edited {editedTimeString}
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <div>{timeString}</div>
                {editedTimeString && <div className="text-xs text-muted-foreground">Edited: {editedTimeString}</div>}
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Message actions - positioned absolutely underneath the message bubble */}
          {isUser && isHovered && !message.isEditing && (
            <div className={cn(
              "absolute flex items-center gap-1 transition-all duration-200 z-10",
              isUser ? "right-0" : "left-0"
            )}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit?.(message.id)}
                className="h-8 px-2 text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur-sm"
                aria-label="Edit message"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderContentWithCode(text: string) {
  const parts = text.split(/```/g);
  if (parts.length === 1) {
    // No code blocks, just render with basic markdown
    return <div className="space-y-2">{renderMarkdown(text)}</div>;
  }
  
  const nodes: any[] = [];
  for (let i = 0; i < parts.length; i++) {
    const chunk = parts[i];
    if (i % 2 === 0) {
      if (chunk.trim()) {
        nodes.push(
          <div key={`t-${i}`} className="space-y-2">
            {renderMarkdown(chunk)}
          </div>
        );
      }
    } else {
      const [maybeLang, ...codeLines] = chunk.split("\n");
      const lang = maybeLang.trim().length <= 10 ? maybeLang.trim() : "";
      const code = (lang ? codeLines.join("\n") : [maybeLang, ...codeLines].join("\n")).replace(/\n+$/g, "");
      const languageClass = lang ? `language-${lang}` : "language-none";
      nodes.push(
        <div key={`c-${i}`} className="relative group">
          <CopyButton text={code} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition" />
          <pre className={cn("rounded-md border bg-muted p-3 overflow-x-auto text-xs sm:text-sm leading-6", languageClass)}>
            <code className={languageClass}>{code}</code>
          </pre>
        </div>
      );
    }
  }
  return <div className="space-y-3">{nodes}</div>;
}

function renderMarkdown(text: string) {
  // Split by lines and process each line
  const lines = text.split('\n');
  const elements: any[] = [];
  
  lines.forEach((line, index) => {
    if (line.trim() === '') {
      elements.push(<br key={`br-${index}`} />);
      return;
    }
    
    // Process bold text **text**
    const processedLine = line.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`bold-${index}-${partIndex}`}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    
    elements.push(
      <p key={`line-${index}`} className="leading-relaxed">
        {processedLine}
      </p>
    );
  });
  
  return elements;
}

export default function ChatPage() {
  usePrismHighlighting();
  useKatex();

  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState("");
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true); // desktop/tablet collapse
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false); // mobile drawer
  const [showScrollLatest, setShowScrollLatest] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useAutoScroll([messages.length]);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
      setShowScrollLatest(!atBottom);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll as any);
  }, [containerRef]);

  const filteredConversations = useMemo(() => {
    return [
      {
        id: "conv-1",
        title: "Study helper",
        last: "QuickSort vs MergeSort",
      },
    ].filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  function addMockUpload() {
    const id = Math.random().toString(36).slice(2);
    const newItem: UploadItem = { id, name: `file-${uploads.length + 1}.pdf`, progress: 0, status: "uploading" };
    setUploads((u) => [...u, newItem]);
    const interval = setInterval(() => {
      setUploads((prev) => {
        const next = prev.map((it): UploadItem => {
          if (it.id !== id) return it;
          const nextProgress = Math.min(100, it.progress + 15);
          const nextStatus: UploadItem["status"] = nextProgress >= 100 ? "done" : "uploading";
          return { ...it, progress: nextProgress, status: nextStatus };
        });
        return next;
      });
    }, 400);
    setTimeout(() => clearInterval(interval), 400 * 8);
  }

  function handleSend() {
    if (!input.trim() || isProcessing) return;
    
    setIsProcessing(true);
    const id = crypto.randomUUID();
    const newMessage: Message = { id, role: "user", content: input, createdAt: Date.now(), status: "sending" };
    setMessages((m) => [...m, newMessage]);
    setInput("");
    
    // Mock delivery
    setTimeout(() => {
      setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, status: "sent" } : msg)));
      
      // Add responding status message
      const respondingId = crypto.randomUUID();
      setMessages((m) => [
        ...m,
        {
          id: respondingId,
          role: "assistant",
          content: "",
          createdAt: Date.now(),
          status: "responding",
        },
      ]);
      
      // Mock assistant reply
      setTimeout(() => {
        setMessages((m) => [
          ...m.filter(msg => msg.id !== respondingId), // Remove responding message
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Here are the main sorting algorithms from CS101:\n\n**QuickSort** - O(n log n) average, O(n²) worst case\n**MergeSort** - O(n log n) guaranteed, stable\n**HeapSort** - O(n log n) always, in-place\n\nEach has different trade-offs for space, stability, and performance. Need more details on any specific algorithm?",
            createdAt: Date.now(),
            status: "sent",
          },
        ]);
        setIsProcessing(false); // Re-enable input after response
      }, 1500); // Longer delay to show responding status
    }, 600);
  }

  function retryMessage(id: string) {
    setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, status: "sending" } : msg)));
    setTimeout(() => {
      setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, status: "sent" } : msg)));
    }, 500);
  }

  function editMessage(id: string) {
    // Find the index of the message being edited
    const messageIndex = messages.findIndex(msg => msg.id === id);
    if (messageIndex === -1) return;
    
    // Remove all messages after the edited message and set editing state
    setMessages((m) => {
      const messagesUpToEdit = m.slice(0, messageIndex + 1);
      return messagesUpToEdit.map((msg) => 
        msg.id === id ? { ...msg, isEditing: true } : msg
      );
    });
  }

  function saveEditMessage(id: string, newContent: string) {
    setMessages((m) => m.map((msg) => 
      msg.id === id 
        ? { ...msg, content: newContent, isEditing: false, editedAt: Date.now() }
        : msg
    ));
    
    // Trigger a new response after editing
    setIsProcessing(true);
    
    // Add responding status message
    const respondingId = crypto.randomUUID();
    setMessages((m) => [
      ...m,
      {
        id: respondingId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        status: "responding",
      },
    ]);
    
    // Mock assistant reply
    setTimeout(() => {
      setMessages((m) => [
        ...m.filter(msg => msg.id !== respondingId), // Remove responding message
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Here are the main sorting algorithms from CS101:\n\n**QuickSort** - O(n log n) average, O(n²) worst case\n**MergeSort** - O(n log n) guaranteed, stable\n**HeapSort** - O(n log n) always, in-place\n\nEach has different trade-offs for space, stability, and performance. Need more details on any specific algorithm?",
          createdAt: Date.now(),
          status: "sent",
        },
      ]);
      setIsProcessing(false); // Re-enable input after response
    }, 1500);
  }

  function cancelEditMessage(id: string) {
    setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, isEditing: false } : msg)));
  }


  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      const id = Math.random().toString(36).slice(2);
      const newItem: UploadItem = { 
        id, 
        name: file.name, 
        progress: 0, 
        status: "uploading" 
      };
      setUploads((u) => [...u, newItem]);
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploads((prev) => {
          const next = prev.map((it): UploadItem => {
            if (it.id !== id) return it;
            const nextProgress = Math.min(100, it.progress + 15);
            const nextStatus: UploadItem["status"] = nextProgress >= 100 ? "done" : "uploading";
            return { ...it, progress: nextProgress, status: nextStatus };
          });
          return next;
        });
      }, 400);
      setTimeout(() => clearInterval(interval), 400 * 8);
    });
  };

  // Subject accents
  const subjectAccentMap: Record<string, string> = {
    all: "from-blue-500/20 to-blue-500/10",
    cs101: "from-emerald-500/20 to-emerald-500/10",
    math201: "from-amber-500/20 to-amber-500/10",
    eng310: "from-purple-500/20 to-purple-500/10",
  };
  const accent = subjectAccentMap[selectedSubject] ?? subjectAccentMap.all;

  const ChatSidebarContent = () => (
    <>
      <div className="p-4 flex items-center gap-2">
        <Button className="w-full" aria-label="Start new chat">
          <Plus className="mr-2 h-4 w-4" /> New Chat
        </Button>
      </div>
      <div className="px-4 pb-2">
        <Label htmlFor="chat-search" className="sr-only">Search chats</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="chat-search"
            placeholder="Search"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto p-2" role="list" aria-label="Conversations">
        {filteredConversations.map((c) => (
          <button
            key={c.id}
            className="w-full text-left rounded-md p-3 hover:bg-muted"
            aria-label={`Open conversation ${c.title}`}
          >
            <div className="font-medium truncate">{c.title}</div>
            <div className="text-sm text-muted-foreground truncate">{c.last}</div>
          </button>
        ))}
      </div>
      <Separator />
      <div className="p-4 space-y-2">
        <div className="text-sm font-medium">Manage</div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm">Settings</Button>
          <Button variant="outline" size="sm">Archive</Button>
          <Button variant="outline" size="sm">Export</Button>
          <Button variant="outline" size="sm">Help</Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] w-full">
      {/* Sidebar - desktop/tablet */}
      {sidebarOpen && (
        <aside className="hidden md:flex w-72 shrink-0 flex-col border-r">
          <ChatSidebarContent />
        </aside>
      )}

      {/* Main panel */}
      <main 
        className={cn(
          "flex-1 flex flex-col relative transition-all duration-300",
          isDragOver && "bg-blue-50 dark:bg-blue-950/20"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className={cn("flex flex-col gap-3 border-b p-4", "bg-gradient-to-r", accent)}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2"></div>
          <div className="flex items-center gap-2">
            {/* Mobile toggle */}
            <div className="md:hidden">
              <Popover open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Toggle sidebar">
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <div className="flex h-[70vh] flex-col">
                    <ChatSidebarContent />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {/* Move subject select next to collapse icon below */}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Title + badge moved down */}
            <div className="flex items-center gap-2">
              <div className="text-base sm:text-lg font-semibold">Chat</div>
              <Badge variant="secondary">Beta</Badge>
            </div>
            {/* Desktop collapse */}
            <div className="hidden md:block">
              <Button
                variant="outline"
                size="icon"
                aria-label="Collapse sidebar"
                onClick={() => setSidebarOpen((v) => !v)}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="hidden md:block">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-[180px]" aria-label="Select subject">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {mockSubjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Drag and drop overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-50/90 dark:bg-blue-950/90 backdrop-blur-sm">
            <div className="text-center p-8 rounded-lg border-2 border-dashed border-blue-400 bg-white/80 dark:bg-gray-900/80">
              <Upload className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-bounce" />
              <p className="text-lg font-medium text-blue-700 dark:text-blue-300">
                Drop files here to upload
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                PDF, Images, Documents, and more
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={containerRef} className="relative flex-1 overflow-y-auto p-4 space-y-4" role="list" aria-label="Messages">
          {messages.map((m) => (
            <MessageBubble 
              key={m.id} 
              message={m} 
              onRetry={retryMessage}
              onEdit={editMessage}
              onSaveEdit={saveEditMessage}
              onCancelEdit={cancelEditMessage}
            />
          ))}
          {showScrollLatest && (
            <div className="pointer-events-none sticky bottom-3 flex justify-center">
              <Button
                size="sm"
                variant="secondary"
                className="pointer-events-auto shadow"
                onClick={() => {
                  const el = containerRef.current;
                  if (!el) return;
                  el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
                }}
              >
                Jump to latest
              </Button>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t p-3 sm:p-4">
          {uploads.length > 0 && (
            <div className="mb-3 space-y-2" aria-live="polite">
              {uploads.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    <div className="font-medium">{u.name}</div>
                    <div className="text-muted-foreground">{u.progress}%</div>
                    {u.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  </div>
                  <Button size="icon" variant="ghost" aria-label="Remove attachment" onClick={() => setUploads((prev) => prev.filter((x) => x.id !== u.id))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  aria-label="Attach"
                  disabled={isProcessing}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-3">
                  <div className="text-sm font-medium">Attach</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={addMockUpload}>PDF</Button>
                    <Button variant="secondary" onClick={addMockUpload}>Image</Button>
                    <Button variant="secondary" onClick={addMockUpload}>Doc</Button>
                    <Button variant="secondary" onClick={addMockUpload}>CSV</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Mock uploads only. No files are sent.</p>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex-1">
              <Label htmlFor="chat-input" className="sr-only">Message</Label>
              <Textarea
                id="chat-input"
                placeholder={isProcessing ? "Processing your message..." : "Ask a question…"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !isProcessing) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="min-h-[72px] resize-y"
                aria-label="Message composer"
                disabled={isProcessing}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setInput((t) => t + " Summarize this.")}
                      disabled={isProcessing}
                    >
                      Summarize
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Append a quick action</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setInput((t) => t + " Generate outline.")}
                      disabled={isProcessing}
                    >
                      Outline
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Append a quick action</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setInput((t) => t + " Show references.")}
                      disabled={isProcessing}
                    >
                      References
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Append a quick action</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <Button 
              onClick={handleSend} 
              disabled={isProcessing || !input.trim()}
              aria-label="Send message"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}


