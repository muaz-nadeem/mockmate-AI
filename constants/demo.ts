export const DEMO_INTERVIEW_ID = "demo-devops-001";

export const demoInterview: Interview = {
  id: DEMO_INTERVIEW_ID,
  userId: "demo",
  role: "DevOps Engineer",
  type: "Technical",
  techstack: ["Docker", "Kubernetes", "AWS", "Terraform", "Jenkins", "Linux"],
  level: "Mid",
  questions: [
    "Can you briefly explain the concept of Continuous Integration (CI) and Continuous Deployment (CD)?",
    "How would you set up automatic scaling for a web application running on AWS? What services would you use?",
    "How would you monitor the health and performance of a distributed system in production? What tools or strategies would you use?",
    "Which monitoring tools have you used, and what kind of metrics do you typically track for a distributed system?",
  ],
  finalized: true,
  createdAt: "2026-04-25T14:30:00Z",
};

export const demoFeedback: Feedback = {
  id: "demo-feedback-001",
  interviewId: DEMO_INTERVIEW_ID,
  totalScore: 42,
  categoryScores: [
    {
      name: "Communication Skills",
      score: 40,
      comment:
        "Responses were fragmented and hard to follow. The candidate relied heavily on filler words and frequently trailed off mid-sentence. Most answers lacked a clear beginning, middle, and end — ideas were scattered rather than structured.",
    },
    {
      name: "Technical Knowledge",
      score: 45,
      comment:
        "The candidate showed surface-level familiarity with CI/CD and AWS but could not go deeper when prompted. Auto-scaling was described vaguely without mentioning specific configurations. Monitoring answer was limited to naming tools without explaining how or why they would be used together.",
    },
    {
      name: "Problem Solving",
      score: 38,
      comment:
        "When asked follow-up questions, the candidate struggled to think through scenarios. The auto-scaling answer missed critical details like scaling policies, cooldown periods, and cost implications. No systematic approach was demonstrated for any of the problems presented.",
    },
    {
      name: "Cultural Fit",
      score: 55,
      comment:
        "The candidate showed willingness to learn and was honest about gaps, which is positive. However, the lack of concrete examples from past work and reliance on theoretical answers made it difficult to assess real-world collaboration and ownership.",
    },
    {
      name: "Confidence and Clarity",
      score: 35,
      comment:
        "Consistently hesitant throughout the entire interview. Nearly every response started with 'uh' and was peppered with 'I think' and 'maybe'. Even when the answer was partially correct, the delivery made it sound like guesswork. Significant improvement needed in this area.",
    },
  ],
  strengths: [],
  areasForImprovement: [
    "Build hands-on experience with AWS — deploy a real application using EC2, Auto Scaling Groups, and ALB instead of only reading about them",
    "Practice explaining CI/CD pipelines end-to-end: from code commit to production deployment, including rollback strategies",
    "Learn monitoring beyond tool names — understand how to set up dashboards, define SLIs/SLOs, and create actionable alerts",
    "Work on eliminating filler words by recording practice answers and reviewing them",
    "Study Kubernetes fundamentals: pods, deployments, services, and ingress before claiming it on a resume",
    "Gain real production experience through personal projects or contributing to open-source DevOps tooling",
  ],
  finalAssessment:
    "The candidate demonstrates a basic understanding of core DevOps concepts such as CI/CD, containerization, and monitoring, and is actively working to improve in these areas. However, there are noticeable gaps in advanced topics like Kubernetes, infrastructure as code, and real-world production experience. Additionally, limited hands-on exposure and communication clarity reduce overall effectiveness for senior-level expectations. At present, the candidate is not fully suitable for a senior DevOps Engineer role. With 3–4 months of focused practical experience and skill refinement, the candidate is encouraged to reapply for this position.",
  createdAt: "2026-04-25T15:15:00Z",
};

export const demoTranscript = [
  { role: "assistant" as const, content: "Hello! Thank you for joining me today. I'm excited to learn about your DevOps experience. Let's jump right in — can you briefly explain the concept of Continuous Integration and Continuous Deployment?" },
  { role: "user" as const, content: "Uh, yeah so CI is like... I think it's when you push code and it automatically, uh, builds? And CD is the deployment part, um, where it goes to production. I think that's basically it, yeah." },
  { role: "assistant" as const, content: "Can you elaborate on why CI is important for a team? How does it help prevent issues?" },
  { role: "user" as const, content: "Um, ok so I think it helps because, uh, everyone is pushing code to the same branch? So you catch problems early. Yeah, I think that's the main reason. Like, instead of waiting till the end." },
  { role: "assistant" as const, content: "Great. Now, how would you set up automatic scaling for a web application running on AWS? What services would you use?" },
  { role: "user" as const, content: "Uh, I think you would use, um, Auto Scaling? And like, maybe a load balancer. I'm not sure about the exact configuration but, uh, I think you set some rules for when to add more servers. Yeah, CloudWatch might be involved too, I think." },
  { role: "assistant" as const, content: "What about scaling beyond EC2 — have you considered container-based or serverless approaches?" },
  { role: "user" as const, content: "Um, yeah I've heard of, uh, ECS and Lambda. I think Lambda is serverless so it scales on its own? And ECS is for containers. I haven't actually, uh, set either of those up myself though. Yeah, I think they're good options but I'm still learning about them." },
  { role: "assistant" as const, content: "How would you monitor the health and performance of a distributed system in production? What tools or strategies would you use?" },
  { role: "user" as const, content: "Ok so, uh, I think you need to check logs and stuff. Um, like make sure the servers are running. I think dashboards are important so you can, uh, see what's happening. Yeah, and maybe set up some alerts for when things go wrong, I think." },
  { role: "assistant" as const, content: "Which monitoring tools have you used, and what kind of metrics do you typically track for a distributed system?" },
  { role: "user" as const, content: "Uh, I've heard of Prometheus and Grafana. Um, I think I've used CloudWatch a little bit. For metrics, uh, I think CPU usage and maybe memory? And like, error rates I guess. I haven't really tracked, um, distributed-specific metrics much. Yeah, I think that's an area I need to work on, ok." },
  { role: "assistant" as const, content: "Thank you for your time today. We'll be in touch with detailed feedback soon. Have a great day!" },
  { role: "user" as const, content: "Thanks! Yeah, uh, it was a good experience. Thank you for the opportunity." },
];

export const demoFillerCounts = {
  uh: 8,
  um: 6,
  like: 4,
  "I think": 6,
  yeah: 4,
  ok: 3,
};
 
