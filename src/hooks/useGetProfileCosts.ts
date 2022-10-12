import { useEffect, useState } from 'react'
import { useTranslation } from 'contexts/Localization'
import BigNumber from 'bignumber.js'
import { BIG_ZERO } from 'utils/bigNumber'
import multicall from 'utils/multicall'
import profileABI from 'config/abi/profile.json'
import { getProfileAddress } from 'utils/addressHelpers'
import useToast from './useToast'

const useGetProfileCosts = () => {
  const { t } = useTranslation()
  const [costs, setCosts] = useState({
    numberCakeToReactivate: BIG_ZERO,
    numberCakeToRegister: BIG_ZERO,
    numberCakeToUpdate: BIG_ZERO,
  })
  const { toastError } = useToast()

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        const calls = ['numberCakeToReactivate', 'numberCakeToRegister', 'numberCakeToUpdate'].map((method) => ({
          address: getProfileAddress(),
          name: method,
        }))
        const [[numberCakeToReactivate], [numberCakeToRegister], [numberCakeToUpdate]] = await multicall(
          profileABI,
          calls,
        )

        setCosts({
          numberCakeToReactivate: new BigNumber(numberCakeToReactivate.toString()),
          numberCakeToRegister: new BigNumber(numberCakeToRegister.toString()),
          numberCakeToUpdate: new BigNumber(numberCakeToUpdate.toString()),
        })
      } catch (error) {
        toastError(t('Error'), t('Could not retrieve CAKE costs for profile'))
      }
    }

    fetchCosts()
  }, [setCosts, toastError, t])

  return costs
}

export default useGetProfileCosts
