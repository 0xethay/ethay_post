'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ethers } from 'ethers'
import {
  HandCoinsIcon,
  Loader2,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
} from 'lucide-react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'

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
  const [product, setProduct] = useState<Product>({
    id: 0,
    name: '',
    price: 0,
    quantity: 1,
    isForSale: false,
    seller: '',
    usdtBalance: 0,
    ipfsLink: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [loadingApprove, setLoadingApprove] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [loadingBuy, setLoadingBuy] = useState(false)
  const [isNeedAllowance, setIsNeedAllowance] = useState(false)
  const queryParams = useSearchParams()
  const shortAddress = (address: string) => {
    return address.slice(0, 6) + '...' + address.slice(-4)
  }
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!
  const contractUsdtAddress = process.env.NEXT_PUBLIC_CONTRACT_USDT!
  const abi = [
    'function getProduct(uint256 _id) public view returns (uint256, string memory, uint256, uint256, bool, address, uint256, string memory, string memory)',
    'function buyProduct(uint256 _id, uint256 _quantity, address _referrer) public',
  ]

  const abiForUsdt = [
    'function allowance(address owner, address spender) public view virtual returns (uint256)',
    'function approve(address spender, uint256 value) public virtual returns (bool)',
    'function balanceOf(address account) public view virtual returns (uint256)',
  ]

  const provider = new ethers.providers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_RPC_URL
  )

  const contractWithProvider = new ethers.Contract(
    contractAddress,
    abi,
    provider
  )

  // const mockData = {
  //   name: 'John Doe',
  //   age: 30,

  const contractData = async () => {
    const data = await contractWithProvider.getProduct(6)
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
    setProduct(() => {
      return {
        ...product,
        price: Number(product.price),
        usdtBalance: Number(product.usdtBalance),
      }
    })
  }

  const handleOnInput = (e: FormEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement
    input.value = input.value.replace(/[^0-9]/g, '')
    if (Number(input.value) < 1) {
      return
    }
    if (Number(input.value) > product.quantity) {
      input.value = product.quantity.toString()
    }
  }

  const handlePlusMinus = (change: number) => {
    if (quantity + change < 1) {
      return
    }
    if (quantity + change > product.quantity) {
      return
    }
    setQuantity((prev) => prev + change)
  }

  const checkIsApproved = async () => {
    setLoadingApprove(true)
    const providerWrite = new ethers.providers.Web3Provider(window.ethereum)
    const signer = providerWrite.getSigner()

    const contractUsdt = new ethers.Contract(
      contractUsdtAddress,
      abiForUsdt,
      signer
    )

    const allowance = await contractUsdt.allowance(
      signer.getAddress(),
      contractAddress
    )
    const allowanceNumber = Number(ethers.utils.formatEther(allowance))
    const sum = product.price * quantity
    if (allowanceNumber < sum) {
      setLoadingApprove(false)
      return false
    }
    setLoadingApprove(false)
    return true
  }

  const approve = async () => {
    setLoadingApprove(true)
    const providerWrite = new ethers.providers.Web3Provider(window.ethereum)
    const signer = providerWrite.getSigner()
    const contractUsdt = new ethers.Contract(
      contractUsdtAddress,
      abiForUsdt,
      signer
    )

    // convert to big number
    const sum = ethers.utils.parseUnits(
      (product.price * quantity).toString(),
      18
    )

    console.log(sum)
    const tx = await contractUsdt.approve(contractAddress, sum)
    console.log(tx)
    await tx.wait()
    setIsNeedAllowance(!(await checkIsApproved()))
    setLoadingApprove(false)
  }

  const buttonCondition = async () => {
    // const sum = product.price * quantity
    // if (sum > Number(ethers.utils.formatEther())) {
    //   return 'Not enough money'
    // }
    if (loadingApprove || loadingBuy) {
      return <Loader2 className="size-4 animate-spin" />
    }
    if (isNeedAllowance) {
      return 'Approve'
    }
    return 'Buy'
  }

  const handleBuy = async () => {
    setLoadingBuy(true)
    const isApproved = await checkIsApproved()
    if (!isApproved) {
      await approve()
      return
    }
    const providerWrite = new ethers.providers.Web3Provider(window.ethereum)
    const signer = providerWrite.getSigner()
    const contractWithSigner = new ethers.Contract(contractAddress, abi, signer)
    const body = {
      id: product.id,
      quantity: quantity,
      referrer: '0x0000000000000000000000000000000000000000',
    }
    console.log(body)
    const tx = await contractWithSigner.buyProduct(
      body.id,
      body.quantity,
      body.referrer
    )
    await tx.wait()
    setLoadingBuy(false)
    console.log(tx)
    setIsNeedAllowance(!(await checkIsApproved()))
  }

  useEffect(() => {
    setLoading(true)
    ;(async () => {
      await contractData()
      setIsNeedAllowance(!(await checkIsApproved()))
      setLoading(false)
    })()
  }, [queryParams])

  return (
    <div className=" flex h-[500px] justify-center items-center ">
      {!loading ? (
        <div className=" p-4 flex flex-col justify-center items-center  rounded-lg gap-y-4 w-full">
          <div className=" text-xl font-bold text-left w-full">
            Seller: {shortAddress(product.seller)}
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
            <div className="text-xl font-bold w-full text-left flex justify-between">
              {product.name}
              <div className=" font-semibold">Price: {product.price} USDT</div>
            </div>
            <div className="flex w-full text-justify text-slate-500 font-semibold">
              {product.description}
            </div>
          </div>
          <div className="flex justify-between gap-x-2 w-full">
            <div className="font-semibold">
              Quantity: {product.quantity} left
            </div>
          </div>
          <div className="flex gap-x-2 w-full">
            <div className="font-semibold w-full">
              <div className="flex items-center gap-x-2 w-full justify-between">
                <div className="flex items-center gap-x-2 ">
                  <Button onClick={() => handlePlusMinus(-1)}>
                    <MinusIcon className="w-4 h-4" />
                  </Button>
                  <Input
                    type="text"
                    placeholder="Enter Text"
                    name="inputName"
                    value={quantity}
                    pattern="^[0-9]+$"
                    onInput={(e) => handleOnInput(e)}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-[150px]"
                  />
                  <Button onClick={() => handlePlusMinus(1)}>
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>
                <div className="font-semibold text-xl">
                  Sum: {product.price * quantity} USDT
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between gap-x-4 w-full">
            <Button
              className="w-full text-lg font-semibold"
              disabled={buttonCondition() === 'Not enough money'}
              onClick={() => handleBuy()}
            >
              {buttonCondition()}
            </Button>
            <Button className="w-full text-lg font-bold">
              <ShoppingCartIcon className="w-4 h-4" />
              Cart
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-xl font-bold flex justify-center items-center gap-x-2">
          <Loader2 className="size-6 animate-spin" />
          Loading...
        </div>
      )}
    </div>
  )
}
