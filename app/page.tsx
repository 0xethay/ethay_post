'use client'

import Image from 'next/image'

export default function Home() {
  const queryParams = useSearchParams()
  return (
    <div className=" w-[500px] flex flex-col justify-center items-center gap-y-4 p-4 border border-primary">
      {queryParams}
      <Image
        src="/ethay_logo.jpg"
        alt="logo"
        width={400}
        height={0}
        priority
        placeholder="empty"
      />
    </div>
  )
}
