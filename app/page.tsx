'use client'

import { ethers } from 'ethers'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  interface Product {
    id: number
    name: string
    price: number
    quantity: number
    isForSale: boolean
    seller: string
    usdtBalance: number
    ipfsLink: string
    description: string
  }
  const queryParams = useSearchParams()
  const mockData: Product = {
    id: 1,
    name: 'John Doe',
    price: 100,
    quantity: 10,
    isForSale: true,
    seller: '0x1234567890abcdef',
    usdtBalance: 1000,
    ipfsLink: 'https://ipfs.io/ipfs/Qm1234567890abcdef',
    description: 'This is a mock product',
  }
  const contractAddress = '0x2612D031139ecC9F2FB6833409669e1392C82eFe'
  const abi = [
    'function getProduct(uint256 _id) public view returns (uint256, string memory, uint256, uint256, bool, address, uint256, string memory, string memory)',
  ]
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_RPC_URL
  )

  const contract = new ethers.Contract(contractAddress, abi, provider)
  // const mockData = {
  //   name: 'John Doe',
  //   age: 30,

  const contractData = async () => {
    const data = await contract.getProduct(0)
    console.log(data)
    // covert bignumber to number
    const product = {
      id: data[0].toNumber(),
      name: data[1],
      price: ethers.utils.formatEther(data[2]),
      quantity: data[3].toNumber(),
      isForSale: data[4],
      seller: data[5],
      usdtBalance: ethers.utils.formatEther(data[6]),
      ipfsLink: data[7],
      description: data[8],
    }
    console.log(product)
  }

  useEffect(() => {
    contractData()
  }, [queryParams])

  return (
    <div className=" w-[500px] flex flex-col justify-center items-center gap-y-4 p-4 border border-primary m-4 rounded-lg">
      <Image
        src="/ethay_logo.jpg"
        alt="logo"
        width={400}
        height={100}
        priority
        style={{
          width: '100%',
          height: 'auto',
        }}
        placeholder="empty"
      />
    </div>
  )
}
