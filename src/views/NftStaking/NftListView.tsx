import React, { useState } from 'react'
import { Card, CardBody, CardFooter, Button, Text, Link, CardHeader, Breadcrumbs } from '@lydiafinance/uikit'
import Page from 'components/layout/Page'
import { useTranslation } from 'contexts/Localization'
import { useWeb3React } from '@web3-react/core'
import { useNftStakeContract } from 'hooks/useContract'
import useToast from 'hooks/useToast'
import { ManageLayout } from './styles'
import NftListItemView from './NftListItemView'

const NftListView = ({ title, emptyText, buttonText, withdrawMode = false, nfts, isLoading, refresh }) => {
  const nftStakeContract = useNftStakeContract()
  const { account } = useWeb3React()
  const [isPending, setPending] = useState(false)
  const { t } = useTranslation()
  const [selectedItems, setSelectedItems] = useState([])
  const isEmpty = nfts.length === 0
  const { toastSuccess, toastError, toastWarning } = useToast()

  const handleSelect = ({ tokenId }) => {
    setSelectedItems([...selectedItems, tokenId])
  }

  const handleDeselect = ({ tokenId }) => {
    setSelectedItems(selectedItems.filter((item) => item !== tokenId))
  }

  const handleStakeEvent = async () => {
    setPending(true)
    try {
      await nftStakeContract.methods
        .stake(selectedItems)
        .send({ from: account })
        .on('transactionHash', (tx) => {
          return tx.transactionHash
        })
        .on('confirmation', () => {
          toastSuccess(t('Success!'), t('You have successfully staked your avaxlion(s).'))
        })
    } catch ({ code }) {
      if (code === 4001) {
        toastWarning(t('Info'), t('Denied transaction signature.'))
      } else {
        toastError(t('Error'), t('Please refresh your page...'))
      }
    } finally {
      setPending(false)
      refresh()
    }
  }

  const handleWithdrawEvent = async () => {
    setPending(true)
    try {
      await nftStakeContract.methods
        .withdraw(selectedItems)
        .send({ from: account })
        .on('transactionHash', (tx) => {
          return tx.transactionHash
        })
        .on('confirmation', () => {
          toastSuccess(t('Success!'), t('You have successfully withdraw your avaxlion(s).'))
        })
    } catch ({ code }) {
      if (code === 4001) {
        toastWarning(t('Info'), t('Denied transaction signature.'))
      } else {
        toastError(t('Error'), t('Please refresh your page...'))
      }
    } finally {
      setPending(false)
      refresh()
    }
  }

  return (
    <Page>
      <ManageLayout className="manage-body">
        <Card className="nft-container-card">
          <CardHeader>
            <Breadcrumbs mb="32px">
              <Link href="/nft-stake" color="secondary" style={{ fontWeight: 400 }}>
                {t('Overview')}
              </Link>
              <Text color="textDisabled">{title}</Text>
            </Breadcrumbs>
          </CardHeader>
          {isEmpty && <CardBody>{isLoading ? t('Please wait...') : emptyText}</CardBody>}
          {!isEmpty && (
            <CardBody className="nft-grid">
              {nfts.map((nft) => (
                <div key={nft.tokenId} className="nft-grid-item">
                  <NftListItemView
                    onSelectEvent={handleSelect}
                    onDeselectEvent={handleDeselect}
                    nft={nft}
                    isSelected={selectedItems.includes(nft.tokenId)}
                    refresh={refresh}
                  />
                </div>
              ))}
            </CardBody>
          )}
          <CardFooter className="manage-footer">
            <Button
              onClick={withdrawMode ? handleWithdrawEvent : handleStakeEvent}
              disabled={(isEmpty && isLoading) || isPending || selectedItems.length === 0}
              variant="danger"
            >
              {isPending ? 'Pending...' : buttonText}
            </Button>
          </CardFooter>
        </Card>
      </ManageLayout>
    </Page>
  )
}

export default NftListView
