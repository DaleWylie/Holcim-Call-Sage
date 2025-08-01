
"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Loader2 } from "lucide-react"
import { cn } from '@/lib/utils';
import type { GenerateNonBiasedReviewInput, GenerateNonBiasedReviewOutput } from '@/ai/flows/generate-non-biased-review';
import { chatAboutReview, ChatMessage } from '@/ai/flows/chat-about-review';

interface ChatPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  reviewInput: GenerateNonBiasedReviewInput;
  reviewOutput: GenerateNonBiasedReviewOutput;
}

export function ChatPanel({ isOpen, setIsOpen, reviewInput, reviewOutput }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom whenever messages change
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: currentMessage };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setCurrentMessage('');
    setIsLoading(true);

    try {
        const result = await chatAboutReview({
            reviewInput,
            reviewOutput,
            chatHistory: newMessages,
            question: userMessage.content,
        });

        const modelMessage: ChatMessage = { role: 'model', content: result.answer };
        setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
        console.error("Chat error:", error);
        const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I encountered an error. Please try again." };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="bottom" className="h-full md:h-[85vh] flex flex-col">
        <SheetHeader className="text-center">
          <SheetTitle className="text-2xl text-primary font-headline">Chat with Call Sage</SheetTitle>
          <SheetDescription>
            Ask questions about the review for agent: <span className="font-semibold text-primary">{reviewOutput.agentName}</span>
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto pr-4 -mr-4">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="space-y-6 p-4">
                    {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={cn(
                        "flex items-start gap-3",
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                    >
                        {msg.role === 'model' && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="/holcim-logo.png" alt="Call Sage" />
                            <AvatarFallback>CS</AvatarFallback>
                        </Avatar>
                        )}
                        <div
                        className={cn(
                            "max-w-md rounded-lg px-4 py-3 text-sm",
                            msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                        >
                           <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3 justify-start">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src="/holcim-logo.png" alt="Call Sage" />
                                <AvatarFallback>CS</AvatarFallback>
                            </Avatar>
                             <div className="max-w-md rounded-lg px-4 py-3 text-sm bg-muted text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>

        <div className="p-4 border-t bg-background">
          <div className="flex items-center gap-2">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="e.g. At what point was hold used?"
              className="flex-1"
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !currentMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
