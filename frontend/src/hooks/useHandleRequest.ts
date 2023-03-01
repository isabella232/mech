import { makeExecTransaction } from "mech-sdk"
import { useSendTransaction } from "wagmi"
import { ProvideWalletConnect } from "./useWalletConnect"

export const useHandleRequest = (mechAddress: string) => {
  const { sendTransactionAsync } = useSendTransaction({
    mode: "recklesslyUnprepared",
  })

  const handleRequest: HandleRequest = async ({ session, request }) => {
    console.debug("handle request", { session, request })

    switch (request.method) {
      case "eth_sendTransaction":
        const txFields = request.params[0] as TransactionFields
        const res = await sendTransactionAsync({
          recklesslySetUnpreparedRequest: makeExecTransaction(
            mechAddress,
            txFields
          ),
        })
        return res.hash

      //   case 'eth_sign':
      //   case 'personal_sign')
      //     result = onSign({session: requestSession, request})
      //   case 'eth_signTypedData':
      //   case 'eth_signTypedData_v3':
      //   case 'eth_signTypedData_v4':
      //     result = onSignTypedData?({session: requestSession, request})
      //   case 'eth_sendTransaction':
      //   case 'eth_signTransaction':
      //     result = onSendTransaction?({session: requestSession, request})
      // }

      // const requestParamsMessage = request.params[0]
      // convert `requestParamsMessage` by using a method like hexToUtf8
      // const message = hexToUtf8(requestParamsMessage)

      // sign the message
      // const signedMessage = await wallet.signMessage(message)

      default:
        throw new Error(`not implemented: ${request.method}`)
    }
  }

  return handleRequest
}

type HandleRequest = React.ComponentProps<
  typeof ProvideWalletConnect
>["onRequest"]

interface TransactionFields {
  data: string
  from: string
  gas: string
  to: string
  value: string
}
