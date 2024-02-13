import React, { useEffect } from "react";
import { useParams } from "react-router-dom";

function CallbackPage() {
  const params = useParams();
  console.log(params);
  return <div></div>;
}

export default CallbackPage;
