"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { chatSession } from "@/utils/GeminiAIModal";
import { LoaderCircle } from "lucide-react";
import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { useRouter } from "next/navigation";

const predefinedRoles = {
  "Full Stack Developer":
    "Proficient in building end-to-end web applications using React, Node.js, MongoDB, and Express. Experience with REST APIs, state management libraries like Redux, and version control using Git. Knowledge of CI/CD pipelines and unit testing frameworks like Jest.",
  "Data Scientist":
    "Skilled in analyzing complex datasets using Python, Pandas, and NumPy. Expertise in Machine Learning algorithms, Deep Learning frameworks like TensorFlow/PyTorch, and statistical modeling. Experienced in SQL for database queries and visualization tools such as Tableau or Power BI.",
  "Frontend Developer":
    "Experienced in crafting responsive and dynamic user interfaces using React, Angular, and Vue.js. Expertise in HTML, CSS (including frameworks like Tailwind and Bootstrap), and JavaScript. Knowledge of browser developer tools and web accessibility standards.",
  "Backend Developer":
    "Proficient in server-side development using Node.js and Express. Skilled in database design and management using SQL (PostgreSQL, MySQL) and NoSQL (MongoDB, DynamoDB). Expertise in building scalable APIs, authentication systems, and server deployment.",
  "Machine Learning Engineer":
    "Specialized in deploying machine learning models using Python, TensorFlow, and scikit-learn. Knowledge of cloud services like AWS SageMaker or Google AI Platform. Experienced in feature engineering, hyperparameter tuning, and real-time model inference.",
  "DevOps Engineer":
    "Expertise in CI/CD pipelines, Docker containers, and orchestration tools like Kubernetes. Proficient in cloud platforms like AWS, Azure, or GCP. Experience with monitoring tools such as Prometheus and logging tools like ELK stack.",
  "Data Engineer":
    "Skilled in designing and maintaining data pipelines using tools like Apache Spark, Kafka, and Airflow. Expertise in data storage solutions (SQL/NoSQL) and ETL processes. Familiarity with cloud-based data solutions such as Snowflake and Redshift.",
  "UI/UX Designer":
    "Proficient in designing user interfaces using tools like Figma, Adobe XD, and Sketch. Skilled in creating wireframes, prototypes, and user journey maps. Knowledge of usability testing and design principles for enhancing user experience.",
  "Cloud Architect":
    "Expert in designing scalable and secure cloud infrastructure. Proficiency in AWS, Azure, or GCP services like EC2, S3, and Lambda. Knowledge of networking, storage, and virtualization technologies.",
  "Cybersecurity Analyst":
    "Experience in identifying vulnerabilities and implementing security protocols. Skilled in penetration testing, threat analysis, and tools like Wireshark and Metasploit. Knowledge of compliance standards like GDPR and ISO 27001.",
  "AI Engineer":
    "Proficient in AI model development using frameworks like TensorFlow and PyTorch. Experience in Natural Language Processing, computer vision, and reinforcement learning. Familiar with AI ethics and governance practices.",
  "Mobile App Developer":
    "Skilled in building cross-platform mobile applications using Flutter, React Native, or Swift. Knowledge of REST APIs, third-party integrations, and performance optimization for mobile devices.",
  "Blockchain Developer":
    "Experienced in building decentralized applications using Ethereum, Solidity, and smart contract development. Knowledge of consensus algorithms, cryptography, and tokenomics.",
  "Game Developer":
    "Proficient in game engines like Unity and Unreal Engine. Skilled in programming languages such as C# and C++. Knowledge of physics simulation, 3D modeling, and rendering techniques.",
  "Data Analyst":
    "Proficient in data cleaning, analysis, and visualization using Python, R, or Excel. Skilled in SQL for database queries and tools like Tableau or Power BI for reporting. Knowledge of statistical methods and business intelligence concepts.",
  "Business Analyst":
    "Experienced in gathering and documenting business requirements, creating process flows, and analyzing data to support decision-making. Skilled in tools like JIRA, Confluence, Excel, and SQL. Knowledge of Agile methodologies and stakeholder communication.",
  "Digital Marketing Specialist":
    "Experienced in designing and executing marketing campaigns across platforms. Skilled in optimizing content for SEO and SEM, and proficient in tools like Google Analytics and AdWords.",
  "Social Media Manager":
    "Proficient in managing social media strategy and creating engaging content. Experienced in audience engagement, analyzing metrics, and using tools like Hootsuite or Buffer.",
  "SEO Specialist":
    "Experienced in conducting keyword research and implementing strategies to improve search rankings. Skilled in using tools like SEMrush, Ahrefs, and Google Search Console.",
  "Content Marketing Manager":
    "Expert in creating, managing, and promoting content to attract and retain customers. Skilled in content strategy development, copywriting, and analytics.",
  "PPC Specialist":
    "Experienced in managing paid advertising campaigns on platforms like Google Ads and social media. Proficient in ad optimization and performance tracking.",
  "Email Marketing Specialist":
    "Skilled in developing and managing email campaigns to drive engagement and sales. Experienced in tools like Mailchimp, Constant Contact, or HubSpot.",
  "Analytics Specialist":
    "Proficient in interpreting marketing performance data to improve ROI. Skilled in tools like Google Analytics, Tableau, and Power BI.",
  "E-commerce Manager":
    "Experienced in driving online sales and optimizing the user experience for e-commerce platforms. Skilled in inventory management, marketing strategies, and tools like Shopify or WooCommerce.",
};

const predefinedDifficulties = {
  "Easy": "Basic questions that test fundamental knowledge and skills.",
  "Medium": "Intermediate questions that require problem-solving and critical thinking.",
  "Hard": "Advanced questions that challenge expertise and experience.",
};


const AddNewInterview = () => {
  const [openDailog, setOpenDialog] = useState(false);
  const [customMode, setCustomMode] = useState(true);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [jsonResponse, setJsonResponse] = useState([]);
  const { user } = useUser();
  const router = useRouter();

  const handleToggleMode = () => {
    setCustomMode(!customMode);
    setJobPosition("");
    setJobDesc("");
  };

  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    setJobPosition(selectedRole);
    setJobDesc(predefinedRoles[selectedRole] || "");
  };

  const handleDifficultyChange = (e) => {
    const difficultyLevel = e.target.value;
    setDifficultyLevel(difficultyLevel);
  };

  const onSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();

    const InputPrompt = `
  Job Positions: ${jobPosition}, 
  Job Description: ${jobDesc}, 
  Years of Experience: ${jobExperience}.
  Difficulty Level: ${difficultyLevel}. All the questions should be of the same level of difficulty. 
  Based on this information, please provide 1 interview question with an answer in JSON format, ensuring "Question" and "Answer" are fields in the JSON. The format should be 
  {
    "Question": "",
    "Answer": ""
  }.
`;

    const result = await chatSession.sendMessage(InputPrompt);
    const MockJsonResp = result.response
      .text()
      .replace("```json", "")
      .replace("```", "")
      .trim();
    setJsonResponse(MockJsonResp);

    if (MockJsonResp) {
      const resp = await db
        .insert(MockInterview)
        .values({
          mockId: uuidv4(),
          jsonMockResp: MockJsonResp,
          jobPosition: jobPosition,
          jobDesc: jobDesc,
          jobExperience: jobExperience,
          createdBy: user?.primaryEmailAddress?.emailAddress,
          createdAt: moment().format("YYYY-MM-DD"),
        })
        .returning({ mockId: MockInterview.mockId });

      if (resp) {
        setOpenDialog(false);
        router.push("/dashboard/interview/" + resp[0]?.mockId);
      }
    } else {
      console.error("Error in response");
    }
    setLoading(false);
  };

  return (
    <div>
      <div
        className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#e62d3c] hover:bg-pink-50 transition-colors group"
        onClick={() => setOpenDialog(true)}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-4">
        <h2 className="text-lg font-medium text-gray-600 group-hover:text-[#e62d3c]">+ Add New</h2>
        </div>
        </div>
      <Dialog open={openDailog} onOpenChange={(isOpen) => setOpenDialog(isOpen)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Tell us more about your job interviewing
            </DialogTitle>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!customMode}
                  onChange={handleToggleMode}
                />
                Use Default
              </label>
            </div>
            <DialogDescription>
              <form onSubmit={onSubmit}>
                <div className="my-3">
                  <h2>
                    Add Details about your job position, job description, and
                    years of experience
                  </h2>

                  <div className="mt-7 my-3">
                    <label className="text-black">Job Role/Job Position</label>
                    <div className="mt-2">
                      {customMode ? (
                        <Input
                          className="mt-1"
                          placeholder="Ex. Full Stack Developer"
                          required
                          value={jobPosition}
                          onChange={(e) => setJobPosition(e.target.value)}
                        />
                      ) : (
                        <select
                          className="mt-1 p-2 border rounded w-full"
                          required
                          value={jobPosition}
                          onChange={handleRoleChange}
                        >
                          <option value="" disabled>
                            Select a job role
                          </option>
                          {Object.keys(predefinedRoles).map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="my-5">
                    <label className="text-black">
                      Job Description/Tech Stack (In Short)
                    </label>
                    <Textarea
                      className="placeholder-opacity-50"
                      placeholder="Ex. Proficient in building end-to-end web applications using React, Node.js, MongoDB, and Express. Experience with REST APIs, state management libraries like Redux, and version control using Git."
                      required
                      value={jobDesc}
                      readOnly={!customMode}
                      onChange={(e) => setJobDesc(e.target.value)}
                    />
                  </div>
                  <div className="my-5">
                    <label className="text-black">Years of Experience</label>
                    <Input
                      className="mt-1"
                      placeholder="Ex. 5"
                      max="50"
                      min="0"
                      type="number"
                      required
                      onChange={(e) => setJobExperience(e.target.value)}
                    />
                  </div>
                  <label className="text-black">Difficulty Level</label>
                  <select
                          className="mt-1 p-2 border rounded w-full"
                          required
                          value={difficultyLevel}
                          onChange={handleDifficultyChange}
                        >
                          <option value="" disabled>
                            Select difficulty level
                          </option>
                          {Object.keys(predefinedDifficulties).map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                </div>
                <div className="flex gap-5 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpenDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="lex-1 bg-[#e62d3c] text-white px-4 py-2 rounded-lg hover:bg-[#d41e2d] transition-colors">
                    {loading ? (
                      <>
                        <LoaderCircle className="animate-spin" />
                        Generating From AI
                      </>
                    ) : (
                      "Start Interview"
                    )}
                  </Button>
                </div>
              </form>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddNewInterview;
