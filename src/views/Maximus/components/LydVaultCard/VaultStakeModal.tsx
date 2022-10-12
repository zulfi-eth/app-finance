import React, { useState } from 'react'
import styled from 'styled-components'
import { Modal, Text, Flex, Image, Button, Slider, BalanceInput, AutoRenewIcon } from '@lydiafinance/uikit'
import { useTranslation } from 'contexts/Localization'
import { useWeb3React } from '@web3-react/core'
import { BASE_EXCHANGE_URL } from 'config'
import { BIG_TEN } from 'utils/bigNumber'
import { useMaximusContact } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import useMaximusWithdrawalFeeTimer from 'hooks/maximus/useMaximusWithdrawalFeeTimer'
import { VaultFees } from 'hooks/maximus/useGetMaximusFees'
import BigNumber from 'bignumber.js'
import { getFullDisplayBalance, formatNumber, getDecimalAmount, getBalanceNumber } from 'utils/formatBalance'
import useToast from 'hooks/useToast'
import { usePools, useGetApiPrice, useGetApiPrices } from 'state/hooks'
import { Maximus, MaximusUserData } from 'state/types'
import { convertLydToShares } from '../../helpers'
import FeeSummary from './FeeSummary'

interface VaultStakeModalProps {
  pool: Maximus
  stakingMax: BigNumber
  stakingTokenPrice: number
  userInfo: MaximusUserData
  isRemovingStake?: boolean
  pricePerFullShare?: BigNumber
  vaultFees?: VaultFees
  setLastUpdated: () => void
  onDismiss?: () => void
}

const StyledButton = styled(Button)`
  flex-grow: 1;
`

const VaultStakeModal: React.FC<VaultStakeModalProps> = ({
  pool,
  stakingMax,
  userInfo,
  isRemovingStake = false,
  vaultFees,
  onDismiss,
  setLastUpdated,
}) => {
  const { account } = useWeb3React()
  const { lpSymbol, userData } = pool
  const maximusContract = useMaximusContact(pool.pid)
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { toastSuccess, toastError } = useToast()
  const [pendingTx, setPendingTx] = useState(false)
  const [stakeAmount, setStakeAmount] = useState('')
  const [percent, setPercent] = useState(0)
  const { hasUnstakingFee } = useMaximusWithdrawalFeeTimer(parseInt(userInfo.depositAt))
  const _lydPrice = useGetApiPrice('lyd')

  const usdValueStaked = stakeAmount && formatNumber(new BigNumber(stakeAmount).times(_lydPrice).toNumber())

  const handleStakeInputChange = (input: string) => {
    if (input) {
      const convertedInput = new BigNumber(input).multipliedBy(BIG_TEN.pow(18))
      const percentage = Math.floor(convertedInput.dividedBy(stakingMax).multipliedBy(100).toNumber())
      setPercent(percentage > 100 ? 100 : percentage)
    } else {
      setPercent(0)
    }
    setStakeAmount(input)
  }

  const totalStakedUsd = getBalanceNumber(userData?.stakedUsd, 0)
  const rawStakedUsd = (totalStakedUsd * percent) / 100
  const displayBalanceUsd = rawStakedUsd.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const handleChangePercent = (sliderPercent: number) => {
    const percentageOfStakingMax = stakingMax.dividedBy(100).multipliedBy(sliderPercent)
    const amountToStake = getFullDisplayBalance(percentageOfStakingMax, 18, 18)
    setStakeAmount(amountToStake)
    setPercent(sliderPercent)
  }

  const handleWithdrawal = async (convertedStakeAmount: BigNumber) => {
    setPendingTx(true)
    const shareStakeToWithdraw = convertLydToShares(convertedStakeAmount, new BigNumber(1000000000000000000))
    // trigger withdrawAll function if the withdrawal will leave 0.000001 LYD or less
    const triggerWithdrawAllThreshold = new BigNumber(1000000000000)
    const sharesRemaining = userInfo.stakedBalance.minus(convertedStakeAmount)
    const isWithdrawingAll = sharesRemaining.lte(triggerWithdrawAllThreshold)

    if (isWithdrawingAll) {
      maximusContract.methods
        .withdrawAll()
        .send({ from: account })
        .on('sending', () => {
          setPendingTx(true)
        })
        .on('receipt', () => {
          toastSuccess(t('Unstaked!'), t('Your earnings have also been harvested to your wallet'))
          setPendingTx(false)
          onDismiss()
          setLastUpdated()
        })
        .on('error', (error) => {
          console.error(error)
          // Remove message from toast before prod
          toastError(t('Error'), t(`${error.message} - Please try again.`))
          setPendingTx(false)
        })
    } else {
      maximusContract.methods
        .withdraw(shareStakeToWithdraw.sharesAsBigNumber.toString())
        // .toString() being called to fix a BigNumber error in prod
        // as suggested here https://github.com/ChainSafe/web3.js/issues/2077
        .send({ from: account })
        .on('sending', () => {
          setPendingTx(true)
        })
        .on('receipt', () => {
          toastSuccess(t('Unstaked!'), t('Your earnings have also been harvested to your wallet'))
          setPendingTx(false)
          onDismiss()
          setLastUpdated()
        })
        .on('error', (error) => {
          console.error(error)
          // Remove message from toast before prod
          toastError(t('Error'), t(`${error.message} - Please try again.`))
          setPendingTx(false)
        })
    }
  }

  const handleDeposit = async (convertedStakeAmount: BigNumber) => {
    maximusContract.methods
      .deposit(convertedStakeAmount.toString())
      // .toString() being called to fix a BigNumber error in prod
      // as suggested here https://github.com/ChainSafe/web3.js/issues/2077
      .send({ from: account })
      .on('sending', () => {
        setPendingTx(true)
      })
      .on('receipt', () => {
        toastSuccess(t('Staked!'), t('Your funds have been staked in the pool'))
        setPendingTx(false)
        onDismiss()
        setLastUpdated()
      })
      .on('error', (error) => {
        console.error(error)
        // Remove message from toast before prod
        toastError(t('Error'), t(`${error.message} - Please try again.`))
        setPendingTx(false)
      })
  }

  const handleConfirmClick = async () => {
    const convertedStakeAmount = getDecimalAmount(new BigNumber(stakeAmount), 18)
    setPendingTx(true)
    // unstaking
    if (isRemovingStake) {
      handleWithdrawal(convertedStakeAmount)
      // staking
    } else {
      handleDeposit(convertedStakeAmount)
    }
  }
  const tokens = lpSymbol?.split('-')

  const ImagesWrapper = styled.div`
    width: 100%;
    max-width: 55px;

    * {
      border-radius: 30px;
    }
    .target-token-symbol {
      top: -12px;
      left: 16px;
    }
    .token-symbol {
    }
  `

  return (
    <Modal
      title={isRemovingStake ? t('Unstake') : t('Stake LP in Maximizer Farm')}
      onDismiss={onDismiss}
      headerBackground={theme.colors.gradients.cardHeader}
    >
      <Flex alignItems="center" justifyContent="space-between" mb="8px">
        <Text bold>{isRemovingStake ? t('Unstake') : t('Stake')}:</Text>
        <Flex alignItems="center" minWidth="70px">
          <ImagesWrapper>
            <Image
              className="token-symbol"
              key="axaa"
              src={`/images/tokens/${tokens[0]?.toLowerCase()}.png`}
              width={22}
              height={22}
            />
            <Image
              className="target-token-symbol"
              key="axaa1"
              src={`/images/tokens/${tokens[1]?.toLowerCase()}.png`}
              width={32}
              height={32}
            />
          </ImagesWrapper>
          <Text ml="30px" bold>
            {lpSymbol}
          </Text>
        </Flex>
      </Flex>
      <BalanceInput
        value={stakeAmount}
        onUserInput={handleStakeInputChange}
        currencyValue={`~${displayBalanceUsd || 0} USD`}
      />
      <Text mt="8px" ml="auto" color="textSubtle" fontSize="12px" mb="8px">
        Balance: {getFullDisplayBalance(stakingMax, 18)}
      </Text>
      <Slider
        min={0}
        max={100}
        value={percent}
        onValueChanged={handleChangePercent}
        name="stake"
        valueLabel={`${percent}%`}
        step={1}
      />
      <Flex alignItems="center" justifyContent="space-between" mt="8px">
        <StyledButton scale="xs" mx="2px" p="4px 16px" variant="tertiary" onClick={() => handleChangePercent(25)}>
          25%
        </StyledButton>
        <StyledButton scale="xs" mx="2px" p="4px 16px" variant="tertiary" onClick={() => handleChangePercent(50)}>
          50%
        </StyledButton>
        <StyledButton scale="xs" mx="2px" p="4px 16px" variant="tertiary" onClick={() => handleChangePercent(75)}>
          75%
        </StyledButton>
        <StyledButton scale="xs" mx="2px" p="4px 16px" variant="tertiary" onClick={() => handleChangePercent(100)}>
          MAX
        </StyledButton>
      </Flex>
      {isRemovingStake && hasUnstakingFee && (
        <FeeSummary
          stakingTokenSymbol={lpSymbol}
          lastDepositedTime={userInfo.depositAt}
          vaultFees={vaultFees}
          stakeAmount={stakeAmount}
        />
      )}
      <Button
        isLoading={pendingTx}
        endIcon={pendingTx ? <AutoRenewIcon spin color="currentColor" /> : null}
        onClick={handleConfirmClick}
        disabled={!stakeAmount || parseFloat(stakeAmount) === 0}
        mt="24px"
      >
        {pendingTx ? t('Confirming') : t('Confirm')}
      </Button>
      {!isRemovingStake && (
        <Button mt="8px" as="a" external href="https://exchange.lydia.finance/#/pool" variant="secondary">
          {t('Get')} {lpSymbol}
        </Button>
      )}
    </Modal>
  )
}

export default VaultStakeModal
