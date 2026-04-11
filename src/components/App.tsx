import React from "react";
import Peep from "react-peeps";
import { useProvider } from "../utils/contextProvider";
import { useAuth } from "../utils/authContext";
import { adjustPeepsViewbox } from "../utils/viewbox";
import LeftMenu from "./leftMenu";
import RightMenu from "./rightMenu";
import { Footer } from "./footer";
import { TaskBoard } from "./TaskBoard";
import { AuthPage } from "./AuthPage";

export const PeepsGenerator: React.FC = () => {
    const { state, dispatch } = useProvider();
    const { user, loading: authLoading } = useAuth();

    const {
        pickedAccessory, pickedBody, pickedFace, pickedFacialHair, pickedHair,
        strokeColor, isFrameTransparent, backgroundBasicColor, isCharacterCreated,
    } = state;

    if (authLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '2rem' }}>
                🎨
            </div>
        );
    }

    if (!user) return <AuthPage />;
    if (isCharacterCreated) return <TaskBoard />;

    return (
        <div className="main-layout">
            <div className='container'>
                <div className="svgWrapper">
                    <Peep
                        style={{ width: 390, height: 390 }}
                        accessory={pickedAccessory}
                        body={pickedBody}
                        face={pickedFace}
                        hair={pickedHair}
                        facialHair={pickedFacialHair}
                        strokeColor={strokeColor}
                        viewBox={adjustPeepsViewbox(pickedBody)}
                        wrapperBackground={isFrameTransparent ? undefined : (backgroundBasicColor as string)}
                    />
                    <button
                        className="confirm-btn"
                        onClick={() => dispatch({ type: 'SET_CHARACTER_CREATED', payload: true })}
                    >
                        Confirmar Personagem
                    </button>
                </div>
                <LeftMenu />
                <RightMenu />
                <Footer />
            </div>
        </div>
    );
};