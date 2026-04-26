import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { demoInterview } from "@/constants/demo";

async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <>
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice real interview questions & get instant feedback
          </p>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview">Start an Interview</Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Interviews</h2>

        <div className="interviews-section">
          <InterviewCard
            interviewId={demoInterview.id}
            userId={user.id}
            role={demoInterview.role}
            type={demoInterview.type}
            techstack={demoInterview.techstack}
            createdAt={demoInterview.createdAt}
          />
        </div>
      </section>
    </>
  );
}

export default Home;
 
