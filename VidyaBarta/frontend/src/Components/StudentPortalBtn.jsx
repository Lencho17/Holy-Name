import React, { useState } from 'react';

function StudentPortalBtn() {
  const [showButtons, setShowButtons] = useState(false);

  const handlePortalClick = () => {
    setShowButtons(true);
  };

  return (
    <div className="flex items-center justify-center w-[100%] mx-auto mt-10">
      {showButtons ? (
        <div className="flex justify-center">
          <a
            href="http://vidyabarta.in/"
            target='_blank'
            className="bg-primary hover:bg-primary text-white text-center text-xl py-5 px-10 w-[70%] h-24 rounded-md duration-200 mr-5"
          >
            Student Login
          </a>
          <a
            href="http://result.vidyabarta.in/"
            target='_blank'
            className="bg-primary hover:bg-primary text-white text-center text-xl py-5 px-10 w-[70%] h-24 rounded-md duration-200"
          >
            Results
          </a>
        </div>
      ) : (
        <a
          onClick={handlePortalClick}
          className="bg-primary hover:bg-primary cursor-pointer text-white text-center text-xl py-2 px-4 w-[80%] h-12 rounded-md duration-200"
        >
          Student Portal
        </a>
      )}
    </div>
  );
}

export default StudentPortalBtn;
