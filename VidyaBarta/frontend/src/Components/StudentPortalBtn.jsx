import React from 'react';
import { Link } from 'react-router-dom';

function StudentPortalBtn() {
  return (
    <div className="flex items-center justify-center w-[100%] mx-auto mt-10">
      <Link
        to="/student-login"
        className="bg-primary hover:bg-primary cursor-pointer text-white text-center text-xl py-2 px-4 w-[80%] h-12 rounded-md duration-200 block leading-8"
      >
        Student Portal
      </Link>
    </div>
  );
}

export default StudentPortalBtn;
