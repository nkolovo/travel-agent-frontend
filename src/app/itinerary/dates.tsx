import React from 'react';
import { Date } from './types/types';

interface DateListProps {
  dates: Date[];
  onSelectedDate: (date: Date) => void;
  onNewDayClick: (date: Date) => void;
}

const DateList: React.FC<DateListProps> = ({ dates, onSelectedDate, onNewDayClick }) => {
  return (
    <div>
      <button
        onClick={() => onNewDayClick}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + New Day
      </button>
      <ul>
        {dates.map((date, index) => (
          <li
            key={index}
            onClick={() => onSelectedDate(date)}
            className='cursor-pointer hover:bg-gray-200 p-2 rounded'
          >
            <h3 className='font-bold'>{date.name}</h3>
            <p>{date.location}</p>
            <p>{date.date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DateList;
