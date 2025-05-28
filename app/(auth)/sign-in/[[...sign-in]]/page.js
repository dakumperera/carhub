import React from 'react'
import { SignIn } from "@clerk/nextjs"; // Make sure to import SignIn from @clerk/nextjs/app-beta

function SignInPage() {
  return (
    <SignIn/>
  )
}

export default SignInPage