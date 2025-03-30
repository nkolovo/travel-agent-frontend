import React from 'react';
import { Date, Activity } from './types/types';
import { FaCalendarAlt, FaPlaneArrival } from "react-icons/fa";

interface DateSummaryProps {
  date: Date | undefined; // The selected date
  activities: Activity[]; // List of activities on that date
}

const DateSummary: React.FC<DateSummaryProps> = ({ date, activities }) => {
  return (
    <div>
      <div className="flex items-center space-x-4 border-b pb-2 mb-4">
        {/* Date with Calendar Icon */}
        <div className="flex items-center space-x-2 text-lg font-semibold text-gray-700">
          <FaCalendarAlt className="text-blue-500" />
          <span>{date?.date}</span>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-gray-400"></div>

        {/* Name with Plane Icon */}
        <div className="flex items-center space-x-2 text-lg font-semibold text-gray-700">
          <FaPlaneArrival className="text-green-500" />
          <span>{date?.name}</span>
        </div>
      </div>

      <div>
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div key={index}>
              <h3>{activity.subheading}</h3>
              <p>{activity.description}</p>
            </div>
          ))
        ) : (
          <h1>No activities for this date.</h1>
        )}
      </div>
    </div>
  );
};

export default DateSummary;
