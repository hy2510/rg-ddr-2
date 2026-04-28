import FrameBody from '@components/FrameBody'
import { WrapperHome } from '@components/main/WrapperHome'
import { MainView } from '@pages/containers/WrapperContainer'
import ContentsList from '@pages/ContentsList'

type MainContainerProps = {
  changeMainView: (view: MainView) => void
}

export default function MainContainer({ changeMainView }: MainContainerProps) {
  const handleExit = () => {
    window.location.replace('/')
  }

  return (
    <FrameBody>
      <WrapperHome>
        <ContentsList
          changeMainView={changeMainView}
          onClickBack={handleExit}
        />
      </WrapperHome>
    </FrameBody>
  )
}
