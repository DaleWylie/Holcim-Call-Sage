
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Loader2, X } from "lucide-react"
import { cn } from '@/lib/utils';
import type { GenerateNonBiasedReviewInput, GenerateNonBiasedReviewOutput } from '@/ai/flows/generate-non-biased-review';
import { chatAboutReview, ChatMessage } from '@/ai/flows/chat-about-review';

interface ChatPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  reviewInput: GenerateNonBiasedReviewInput;
  reviewOutput: GenerateNonBiasedReviewOutput;
  onReviewAmended: (newReview: GenerateNonBiasedReviewOutput) => void;
}

export function ChatPanel({ isOpen, setIsOpen, reviewInput, reviewOutput, onReviewAmended }: ChatPanelProps) {
  const agentFirstName = reviewOutput.agentName.split(' ')[0] || 'the agent';
  const initialMessage: ChatMessage = {
    role: 'model',
    content: `Hey, do you want to discuss the Generated Review for ${agentFirstName}? Let me know if you have any questions!`
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
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
  }, [messages, isLoading]);

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

        if (result.amendedReview) {
            onReviewAmended(result.amendedReview);
            // Optionally, add another message confirming the update
            const confirmationMessage: ChatMessage = { role: 'model', content: "I've updated the review for you. You should see the changes reflected on the main page." };
            setMessages(prev => [...prev, confirmationMessage]);
        }

    } catch (error) {
        console.error("Chat error:", error);
        const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I encountered an error. Please try again." };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };


  if (!isOpen) {
    return null;
  }

  return (
    <Card className="fixed bottom-24 right-6 w-[400px] h-[500px] z-10 shadow-2xl flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <CardTitle className="text-lg text-primary font-headline">Chat with Call Sage</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
            </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
             <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="space-y-4 p-4">
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
                            "max-w-xs rounded-lg px-3 py-2 text-sm",
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
                             <div className="rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t">
            <div className="flex items-center gap-2 w-full">
                <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about the review..."
                className="flex-1"
                disabled={isLoading}
                />
                <Button onClick={handleSendMessage} disabled={isLoading || !currentMessage.trim()}>
                <Send className="h-4 w-4" />
                </Button>
            </div>
        </CardFooter>
    </Card>
  );
}
