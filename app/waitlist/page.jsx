import React from "react";

function WaitlistPage() {
  return (
    <div className="mt-20 fixed w-full flex flex-col ">
      <div className="aspect-video w-full  ">
        <iframe
          style={{width: "100%" }}
          height="569"
          src="https://carhub-waitlist.created.app"
          title="Waiting List Landing Page"
          frameBorder="0"
        ></iframe>
      </div>
    </div>
  );
}

export default WaitlistPage;
