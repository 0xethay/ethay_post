'use client'

import { Button } from '@/components/ui/button'
import { ethers } from 'ethers'
import { HandCoinsIcon, ShoppingCartIcon } from 'lucide-react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

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
  const [data, setData] = useState()
  const queryParams = useSearchParams()
  const shortAddress = (address: string) => {
    return address.slice(0, 6) + '...' + address.slice(-4)
  }
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
  }

  useEffect(() => {
    contractData()
  }, [queryParams])

  return (
    <div className=" flex h-[400px] justify-center items-center ">
      <div className=" p-4 flex flex-col justify-center items-center  rounded-lg gap-y-2 w-full">
        <div className=" text-xl font-bold text-left w-full">
          Seller: {shortAddress(mockData.seller)}
        </div>
        <Image
          src="/ethay_logo.jpg"
          alt="logo"
          width={1500}
          height={100}
          priority
          style={{
            width: '100%',
            height: 'auto',
          }}
          className="rounded-lg"
          placeholder="empty"
        />
        <div className=" flex flex-col w-full">
          <div className="text-xl font-bold w-full text-left">
            {mockData.name}
          </div>
          <div className="flex w-full text-justify text-slate-500 font-semibold">
            {mockData.description}
          </div>
        </div>
        <div className="flex justify-between gap-x-2 w-full">
          <div className=" font-semibold">Amount: {mockData.price} USDT</div>
          <div className="font-semibold">
            Quantity: {mockData.quantity} left
          </div>
        </div>
        <div className="flex justify-between gap-x-4 w-full">
          <Button className="w-full text-lg font-semibold">
            <HandCoinsIcon className="w-4 h-4" />
            Buy
          </Button>
          <Button className="w-full text-lg font-bold">
            <ShoppingCartIcon className="w-4 h-4" />
            Cart
          </Button>
        </div>
      </div>
    </div>
  )
}
