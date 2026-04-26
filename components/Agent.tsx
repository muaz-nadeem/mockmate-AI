"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface SummaryData {
  feedbackId: string;
  totalScore: number;
  finalAssessment: string;
  areasForImprovement: string[];
  strengths: string[];
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSummarySpeaking, setIsSummarySpeaking] = useState(false);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.log("Error:", error);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  // Speak the post-interview summary using the browser's Web Speech API
  const speakSummary = (data: SummaryData) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const areas =
      data.areasForImprovement.length > 0
        ? `Here are the main areas you should focus on. ${data.areasForImprovement
            .map((a, i) => `Number ${i + 1}. ${a}`)
            .join(" ")}`
        : "Great job! I did not find major areas of weakness.";

    const text = `Thanks for completing the interview. Your overall score is ${data.totalScore} out of 100. ${data.finalAssessment} ${areas} Keep practicing and you will improve quickly.`;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.lang = "en-US";
      utterance.onstart = () => setIsSummarySpeaking(true);
      utterance.onend = () => setIsSummarySpeaking(false);
      utterance.onerror = () => setIsSummarySpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSummarySpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSummarySpeaking(false);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (msgs: SavedMessage[]) => {
      setIsGeneratingSummary(true);
      const result = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: msgs,
        feedbackId,
      });
      setIsGeneratingSummary(false);

      if (result?.success && result.feedback) {
        const data: SummaryData = {
          feedbackId: result.feedbackId!,
          totalScore: result.feedback.totalScore,
          finalAssessment: result.feedback.finalAssessment,
          areasForImprovement: result.feedback.areasForImprovement || [],
          strengths: result.feedback.strengths || [],
        };
        setSummary(data);
        speakSummary(data);
      } else {
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED && !summary && !isGeneratingSummary) {
      if (type === "generate") {
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [
    messages,
    callStatus,
    feedbackId,
    interviewId,
    router,
    type,
    userId,
    summary,
    isGeneratingSummary,
  ]);

  // Cancel any ongoing speech when leaving the component
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    if (type === "generate") {
      await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
        variableValues: {
          username: userName,
          userid: userId,
        },
      });
    } else {
      let formattedQuestions = "";
      if (questions) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");
      }

      await vapi.start(interviewer, {
        variableValues: {
          questions: formattedQuestions,
        },
      });
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  const goToFullFeedback = () => {
    stopSpeaking();
    router.push(`/interview/${interviewId}/feedback`);
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {(isSpeaking || isSummarySpeaking) && (
              <span className="animate-speak" />
            )}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && !summary && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      {isGeneratingSummary && (
        <div className="transcript-border">
          <div className="transcript">
            <p className="animate-fadeIn opacity-100">
              Analyzing your interview and preparing personalized feedback...
            </p>
          </div>
        </div>
      )}

      {summary && (
        <div className="summary-card">
          <div className="summary-header">
            <h3>Interview Wrap-up</h3>
            <p className="summary-score">
              Score: <span>{summary.totalScore}</span>/100
            </p>
          </div>

          <p className="summary-assessment">{summary.finalAssessment}</p>

          <div className="summary-section">
            <h4>Areas to focus on</h4>
            {summary.areasForImprovement.length > 0 ? (
              <ul>
                {summary.areasForImprovement.map((area, i) => (
                  <li key={i}>{area}</li>
                ))}
              </ul>
            ) : (
              <p>No major weak areas detected. Excellent work!</p>
            )}
          </div>

          {summary.strengths.length > 0 && (
            <div className="summary-section">
              <h4>What you did well</h4>
              <ul>
                {summary.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="summary-actions">
            {isSummarySpeaking ? (
              <button className="btn-secondary" onClick={stopSpeaking}>
                Stop voice
              </button>
            ) : (
              <button
                className="btn-secondary"
                onClick={() => speakSummary(summary)}
              >
                Replay voice
              </button>
            )}
            <button className="btn-primary" onClick={goToFullFeedback}>
              View full feedback
            </button>
          </div>
        </div>
      )}

      {!summary && !isGeneratingSummary && (
        <div className="w-full flex justify-center">
          {callStatus !== "ACTIVE" ? (
            <button className="relative btn-call" onClick={() => handleCall()}>
              <span
                className={cn(
                  "absolute animate-ping rounded-full opacity-75",
                  callStatus !== "CONNECTING" && "hidden"
                )}
              />

              <span className="relative">
                {callStatus === "INACTIVE" || callStatus === "FINISHED"
                  ? "Call"
                  : ". . ."}
              </span>
            </button>
          ) : (
            <button className="btn-disconnect" onClick={() => handleDisconnect()}>
              End
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default Agent;
 
