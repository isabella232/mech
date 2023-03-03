import { makeExecTransaction } from "mech-sdk"
import { useCallback } from "react"
import { useJsonRpcSigner } from "./useJsonRpcSigner"
import { ProvideWalletConnect } from "./useWalletConnect"

export const useHandleRequest = (mechAddress: string) => {
  const signer = useJsonRpcSigner()

  const handleRequest = useCallback<HandleRequest>(
    async ({ session, request }) => {
      console.debug("handle request", { session, request })
      if (!signer) {
        throw new Error("signer not available")
      }

      switch (request.method) {
        // transaction need to be wrapped
        case "eth_sendTransaction": {
          const txFields = request.params[0] as TransactionFields
          // use ethers signer to auto-populate gas and nonce rather than using provider.send
          const res = await signer.sendTransaction(
            makeExecTransaction(mechAddress, txFields)
          )
          return res.hash
        }
        case "eth_signTransaction": {
          const txFields = request.params[0] as TransactionFields
          return await signer.signTransaction(
            makeExecTransaction(mechAddress, txFields)
          )
        }

        default:
          try {
            return await signer.provider.send(request.method, request.params)
          } catch (e: any) {
            let jsonRpcBody
            try {
              jsonRpcBody =
                typeof e === "object" &&
                "body" in e &&
                typeof e.body === "string"
                  ? JSON.parse(e.body)
                  : undefined
            } catch (pe) {}

            if (jsonRpcBody?.error?.code) {
              throw new JsonRpcError(
                jsonRpcBody.error.code,
                jsonRpcBody.error.message
              )
            }

            throw e
          }
      }
    },
    [mechAddress, signer]
  )

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

export class JsonRpcError extends Error {
  jsonRpcCode: number
  jsonRpcMessage: string | null | undefined

  constructor(public code: number, message?: string | null) {
    super(`JSON-RPC error ${code}: ${message || ""}`)
    this.jsonRpcCode = code
    this.jsonRpcMessage = message
  }
}
