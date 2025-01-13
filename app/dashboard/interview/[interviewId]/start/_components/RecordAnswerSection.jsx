"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useContext, useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { chatSession } from "@/utils/GeminiAIModal";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { WebCamContext } from "@/app/dashboard/layout";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useRouter } from 'next/navigation';
const RecordAnswerSection = ({
  mockInterviewQuestion,
  activeQuestionIndex,
  interviewData,
  setShowEndinterviewButton,
  setFollowUpQuestion,
}) => {
  const [userAnswer, setUserAnswer] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { webCamEnabled, setWebCamEnabled } = useContext(WebCamContext);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [followUpCount, setFollowUpCount] = useState(0);
  const router = useRouter();

  const MIN_WORD_COUNT = 20;

  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

  useEffect(() => {
    if (!isRecording && userAnswer.length > 10) {
      updateUserAnswer();
    }
  }, [userAnswer, mockInterviewQuestion]);

  const startRecording = async () => {
    if (!webCamEnabled) {
      toast("Please enable the webcam before starting the recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast("Error starting recording. Please check your microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      setLoading(true);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(",")[1];

        const result = await model.generateContent([
          "Transcribe the following audio:",
          { inlineData: { data: base64Audio, mimeType: "audio/webm" } },
        ]);

        const transcription = result.response.text();
        setUserAnswer((prevAnswer) => prevAnswer + " " + transcription);
        setLoading(false);
      };
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast("Error transcribing audio. Please try again.");
      setLoading(false);
    }
  };

  const updateUserAnswer = async () => {

    const wordCount = userAnswer.trim().split(/\s+/).length;
    if (wordCount < MIN_WORD_COUNT) {
      toast(`Your answer is too short. Please provide at least ${MIN_WORD_COUNT} words.`);
      return;
    }

    try {
      if (followUpCount >= 4) {
        // Redirect to the feedback page if the follow-up count exceeds 4
        router.push(`/dashboard/interview/${interviewData?.mockId}/feedback`);
        return;
      }

      setLoading(true);
      const feedbackPrompt =
        followUpCount < 4
          ? `Question: ${mockInterviewQuestion.Question}, User Answer: ${userAnswer}, Please give us a rating for the answer, feedback for improvement, and generate 1 easy follow-up question in JSON format with fields {"followUpQuestion": "", "feedback": "", "rating": ""}. do not make the questions hard`
          : `Question: ${mockInterviewQuestion.Question}, User Answer: ${userAnswer}, Please give a rating for the answer and feedback for improvement in JSON format with fields {"feedback": "", "rating": ""}.`;

      const result = await chatSession.sendMessage(feedbackPrompt);

      let MockJsonResp = result.response.text();
      console.log(MockJsonResp);

      MockJsonResp = MockJsonResp.replace("```json", "").replace("```", "");

      let jsonFeedbackResp;
      try {
        jsonFeedbackResp = JSON.parse(MockJsonResp);
      } catch (e) {
        throw new Error("Invalid JSON response: " + MockJsonResp);
      }

      const followUpQuestion = jsonFeedbackResp?.followUpQuestion || null;

      // Save user answer along with feedback, rating, and follow-up question
      const resp = await db.insert(UserAnswer).values({
        mockIdRef: interviewData?.mockId,
        question: mockInterviewQuestion.Question,
        correctAns: mockInterviewQuestion.Answer,
        userAns: userAnswer,
        feedback: jsonFeedbackResp?.feedback,
        rating: jsonFeedbackResp?.rating,
        followUpQuestion: followUpQuestion, // Save follow-up question in DB
        userEmail: user?.primaryEmailAddress?.emailAddress,
        createdAt: moment().format("YYYY-MM-DD"),
      });

      if (followUpCount < 4 && followUpQuestion) {
        setFollowUpQuestion(followUpQuestion); // Update the state for follow-up question
        setFollowUpCount((prevCount) => prevCount + 1); // Increment follow-up count
      }

      if (resp) {
        toast("User Answer and Follow-Up Question recorded successfully");
      }
      setUserAnswer("");
      setLoading(false);
      setShowEndinterviewButton(true);
    } catch (error) {
      console.error(error);
      toast("An error occurred while recording the user answer");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center overflow-hidden">
      <div className="flex flex-col justify-center items-center rounded-lg p-5 bg-black mt-4 w-[30rem] ">
        {webCamEnabled ? (
          <Webcam
            mirrored={true}
            style={{ height: 250, width: "100%", zIndex: 10 }}
          />
        ) : (
          <Image
            src={"/camera.jpg"}
            width={200}
            height={200}
            alt="Camera placeholder"
          />
        )}
      </div>
      <div className="md:flex mt-4 md:mt-8 md:gap-5">
        <div className="my-4 md:my-0">
          <Button
            className="flex-1 bg-[#e62d3c] text-white px-4 py-2 rounded-lg hover:bg-[#d41e2d] transition-colors"
            onClick={() => setWebCamEnabled((prev) => !prev)}
          >
            {webCamEnabled ? "Close WebCam" : "Enable WebCam"}
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
        >
          {isRecording ? (
            <h2 className="text-red-400 flex gap-2 ">
              <Mic /> Stop Recording...
            </h2>
          ) : (
            " Record Answer"
          )}
        </Button>
      </div>
    </div>
  );
};

export default RecordAnswerSection;
