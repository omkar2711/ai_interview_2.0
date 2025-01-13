import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Award } from 'lucide-react';

const QuestionItemCard = ({ question }) => {
  const router = useRouter();
  const onStart = () => {
    router.push("/dashboard/pyq/" + question?.mockId);
  };
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-2 mb-4">
      <h2 className="text-lg font-semibold text-gray-900">{question?.jobPosition}</h2>
       <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                {/* <span>{formatDate(interview.date)}</span> */}
                {question?.jobExperience} Years of experience
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                {/* <span>{interview.duration} minutes</span> */}
                Created At : {question.createdAt}
              </div>

      </div>
      
      <div className="flex justify-between mt-2 gap-5 ">
        <Button onClick={onStart} size="sm" className="flex-1 bg-[#e62d3c] text-white px-4 py-2 rounded-lg hover:bg-[#d41e2d] transition-colors">
          Start
        </Button>
      </div>
    </div>
  );
};

export default QuestionItemCard;