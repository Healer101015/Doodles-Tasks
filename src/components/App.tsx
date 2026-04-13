import React, { useEffect } from "react";
import Peep from "react-peeps";
import { useProvider } from "../utils/contextProvider";
import { useAuth } from "../utils/authContext";
import { adjustPeepsViewbox } from "../utils/viewbox";
import LeftMenu from "./leftMenu";
import RightMenu from "./rightMenu";
import { Footer } from "./footer";
import { TaskBoard } from "./TaskBoard";
import { AuthPage } from "./AuthPage";
import { CharacterCreator } from "./CharacterCreator";

export const PeepsGenerator: React.FC = () => {
    const { state, dispatch } = useProvider();
    const { user, loading: authLoading, saveAvatar } = useAuth();

    const {
        pickedAccessory, pickedBody, pickedFace, pickedFacialHair, pickedHair,
        strokeColor, isFrameTransparent, backgroundBasicColor, isCharacterCreated,
    } = state;

    useEffect(() => {
        if (user && user.avatarConfig && Object.keys(user.avatarConfig).length > 0) {
            const cfg = user.avatarConfig as Record<string, unknown>;
            if (cfg.pickedHair) dispatch({ type: 'SET_HAIR', payload: cfg.pickedHair });
            if (cfg.pickedBody) dispatch({ type: 'SET_BODY', payload: cfg.pickedBody });
            if (cfg.pickedFace) dispatch({ type: 'SET_FACE', payload: cfg.pickedFace });
            if (cfg.pickedFacialHair) dispatch({ type: 'SET_FACIAL_HAIR', payload: cfg.pickedFacialHair });
            if (cfg.pickedAccessory) dispatch({ type: 'SET_ACCESSORY', payload: cfg.pickedAccessory });
            if (cfg.strokeColor) dispatch({ type: 'SET_STROKE_COLOR', payload: cfg.strokeColor });
            if (cfg.backgroundBasicColor) dispatch({ type: 'SET_BACKGROUND_BASIC_COLOR', payload: cfg.backgroundBasicColor });
            if (cfg.isFrameTransparent !== undefined) dispatch({ type: 'SET_FRAME_TYPE', payload: cfg.isFrameTransparent });
            dispatch({ type: 'SET_CHARACTER_CREATED', payload: true });
        }
    }, [user]);

    if (authLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '2rem' }}>
                🎨
            </div>
        );
    }

    if (!user) return <AuthPage />;
    if (isCharacterCreated) return <TaskBoard />;

    return <CharacterCreator />;
};