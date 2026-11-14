import type { Metadata } from "next"

import PostCheckForm from "./_components/post-check-form"

export const metadata: Metadata = { title: "Post a check" }

export default function PostCheckPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="display m-0 text-[40px] leading-none">Post a check</h1>
        <p className="m-0 text-[15px] text-muted-light">Tell us where, and what you need to see. Someone nearby goes and photographs it.</p>
      </div>
      <PostCheckForm />
    </div>
  )
}
