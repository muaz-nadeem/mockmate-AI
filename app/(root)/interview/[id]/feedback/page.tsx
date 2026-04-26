import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import FillerWordsChart from "@/components/FillerWordsChart";
import {
  DEMO_INTERVIEW_ID,
  demoTranscript,
  demoFillerCounts,
} from "@/constants/demo";

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  const isDemo = id === DEMO_INTERVIEW_ID;
  const transcript = isDemo ? demoTranscript : null;
  const fillerData = isDemo ? demoFillerCounts : null;

  return (
    <section className="section-feedback">
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold">
          Feedback on the Interview -{" "}
          <span className="capitalize">{interview.role}</span> Interview
        </h1>
      </div>

      <div className="flex flex-row justify-center ">
        <div className="flex flex-row gap-5">
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p>
              Overall Impression:{" "}
              <span className="text-primary-200 font-bold">
                {feedback?.totalScore}
              </span>
              /100
            </p>
          </div>

          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p>
              {feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr />

      {feedback?.finalAssessment && (
        <div className="flex flex-col gap-3">
          {feedback.finalAssessment.includes("not fully suitable") ? (
            <>
              <p>
                {feedback.finalAssessment.split("At present,")[0]}
              </p>
              <p className="verdict-highlight">
                {"At present," + feedback.finalAssessment.split("At present,")[1]}
              </p>
            </>
          ) : (
            <p>{feedback.finalAssessment}</p>
          )}
        </div>
      )}

      {/* Filler Words Chart */}
      {fillerData && <FillerWordsChart data={fillerData} />}

      {/* Conversation Transcript */}
      {transcript && transcript.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2>Your Conversation</h2>
          <div className="transcript-list">
            {transcript.map((m, i) => (
              <div
                key={i}
                className={`transcript-row transcript-row--${m.role}`}
              >
                <span className="transcript-role">
                  {m.role === "assistant" ? "Interviewer" : "You"}
                </span>
                <p className="transcript-text">{m.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interview Breakdown */}
      <div className="flex flex-col gap-4">
        <h2>Breakdown of the Interview:</h2>
        {feedback?.categoryScores?.map((category, index) => (
          <div key={index}>
            <p className="font-bold">
              {index + 1}. {category.name} ({category.score}/100)
            </p>
            <p>{category.comment}</p>
          </div>
        ))}
      </div>

      {feedback?.strengths && feedback.strengths.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3>Strengths</h3>
          <ul>
            {feedback.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>
      )}

      {feedback?.areasForImprovement && feedback.areasForImprovement.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3>Areas for Improvement</h3>
          <ul>
            {feedback.areasForImprovement.map((area, index) => (
              <li key={index}>{area}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="buttons">
        <Button className="btn-secondary flex-1">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to dashboard
            </p>
          </Link>
        </Button>

        <Button className="btn-primary flex-1">
          <Link
            href={`/interview/${id}`}
            className="flex w-full justify-center"
          >
            <p className="text-sm font-semibold text-black text-center">
              Retake Interview
            </p>
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default Feedback;
 
