import React, { useState, useCallback, useEffect } from "react";
import Peep from "react-peeps";
import {
    Accessories, BustPose, Face, FacialHair, Hair,
    AccessoryType, BustPoseType, FaceType, FacialHairType, HairType,
    SittingPose, SittingPoseType, StandingPose, StandingPoseType
} from "react-peeps";
import { useProvider } from "../utils/contextProvider";
import { useAuth } from "../utils/authContext";
import { adjustPeepsViewbox, distinguishBodyViewbox } from "../utils/viewbox";
import ColorModal from "./colorModal";
import { SectionValues } from "./types";

type PieceSectionKeys = 'Hair' | 'Body' | 'Face' | 'FacialHair' | 'Accessories';

const sections: PieceSectionKeys[] = ['Hair', 'Face', 'FacialHair', 'Body', 'Accessories'];

const sectionEmoji: Record<PieceSectionKeys, string> = {
    Hair: '💇',
    Face: '😊',
    FacialHair: '🧔',
    Body: '👕',
    Accessories: '🕶️',
};

const getPieces = (section: PieceSectionKeys): string[] => {
    switch (section) {
        case 'Hair': return Object.keys(Hair);
        case 'Body': return [...Object.keys(BustPose), ...Object.keys(SittingPose), ...Object.keys(StandingPose)];
        case 'Face': return Object.keys(Face);
        case 'FacialHair': return Object.keys(FacialHair);
        case 'Accessories': return Object.keys(Accessories);
        default: return [];
    }
};

const renderPiece = (section: PieceSectionKeys, piece: string) => {
    switch (section) {
        case 'Hair': return React.createElement(Hair[piece as HairType]);
        case 'Body': return React.createElement(
            BustPose[piece as BustPoseType] ||
            SittingPose[piece as SittingPoseType] ||
            StandingPose[piece as StandingPoseType]
        );
        case 'Face': return React.createElement(Face[piece as FaceType]);
        case 'FacialHair': return React.createElement(FacialHair[piece as FacialHairType]);
        case 'Accessories': return React.createElement(Accessories[piece as AccessoryType]);
    }
};

const getViewbox = (section: PieceSectionKeys, piece: string): string => {
    switch (section) {
        case 'Accessories': return '-75 -125 500 400';
        case 'Body': return distinguishBodyViewbox(piece);
        case 'Hair': return '0 -100 550 750';
        case 'FacialHair': return '-50 -100 500 400';
        case 'Face': return '0 -20 300 400';
        default: return '0 0 500 500';
    }
};

const getPickedPiece = (section: PieceSectionKeys, state: any): string => {
    switch (section) {
        case 'Hair': return state.pickedHair;
        case 'Body': return state.pickedBody;
        case 'Face': return state.pickedFace;
        case 'FacialHair': return state.pickedFacialHair;
        case 'Accessories': return state.pickedAccessory;
        default: return '';
    }
};

const getDispatchKey = (section: PieceSectionKeys) => {
    switch (section) {
        case 'Hair': return 'SET_HAIR';
        case 'Body': return 'SET_BODY';
        case 'Face': return 'SET_FACE';
        case 'FacialHair': return 'SET_FACIAL_HAIR';
        case 'Accessories': return 'SET_ACCESSORY';
        default: return '';
    }
};

export const CharacterCreator: React.FC = () => {
    const { state, dispatch } = useProvider();
    const { saveAvatar } = useAuth();
    const [activeSection, setActiveSection] = useState<PieceSectionKeys>('Hair');
    const [saving, setSaving] = useState(false);

    const {
        pickedAccessory, pickedBody, pickedFace, pickedFacialHair, pickedHair,
        strokeColor, isFrameTransparent, backgroundBasicColor,
    } = state;

    const pieces = getPieces(activeSection);
    const pickedPiece = getPickedPiece(activeSection, state);

    const handleSelect = useCallback((piece: string) => {
        dispatch({ type: getDispatchKey(activeSection) as any, payload: piece });
    }, [activeSection, dispatch]);

    const handleShuffle = useCallback(() => {
        const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];
        dispatch({ type: 'SET_HAIR', payload: pick(Object.keys(Hair)) });
        dispatch({ type: 'SET_BODY', payload: pick([...Object.keys(BustPose), ...Object.keys(SittingPose), ...Object.keys(StandingPose)]) });
        dispatch({ type: 'SET_FACE', payload: pick(Object.keys(Face)) });
        dispatch({ type: 'SET_FACIAL_HAIR', payload: pick(Object.keys(FacialHair)) });
        dispatch({ type: 'SET_ACCESSORY', payload: pick(Object.keys(Accessories)) });
    }, [dispatch]);

    const handleConfirm = useCallback(async () => {
        setSaving(true);
        try {
            await saveAvatar({
                pickedHair, pickedBody, pickedFace, pickedFacialHair, pickedAccessory,
                strokeColor, backgroundBasicColor, isFrameTransparent,
            });
        } catch {
        } finally {
            setSaving(false);
        }
        dispatch({ type: 'SET_CHARACTER_CREATED', payload: true });
    }, [saveAvatar, dispatch, pickedHair, pickedBody, pickedFace, pickedFacialHair, pickedAccessory, strokeColor, backgroundBasicColor, isFrameTransparent]);

    return (
        <div style={styles.root}>
            <div style={styles.card}>
                <h1 style={styles.title}>Crie seu personagem</h1>
                <p style={styles.subtitle}>Personalize seu avatar antes de começar</p>

                <div style={styles.previewWrap}>
                    <div style={styles.previewInner}>
                        <Peep
                            style={{ width: 180, height: 180 }}
                            accessory={pickedAccessory}
                            body={pickedBody}
                            face={pickedFace}
                            hair={pickedHair}
                            facialHair={pickedFacialHair}
                            strokeColor={strokeColor}
                            viewBox={adjustPeepsViewbox(pickedBody)}
                            wrapperBackground={isFrameTransparent ? undefined : (backgroundBasicColor as string)}
                        />
                    </div>

                    <div style={styles.colorRow}>
                        <div style={styles.colorItem}>
                            <span style={styles.colorLabel}>Corpo</span>
                            <ColorModal type="Foreground" />
                        </div>
                        <div style={styles.colorItem}>
                            <span style={styles.colorLabel}>Fundo</span>
                            <ColorModal type="Background" />
                        </div>
                    </div>
                </div>

                <div style={styles.sectionTabs}>
                    {sections.map(s => (
                        <button
                            key={s}
                            style={{ ...styles.tabBtn, ...(activeSection === s ? styles.tabActive : {}) }}
                            onClick={() => setActiveSection(s)}
                            title={s}
                        >
                            <span style={{ fontSize: 18 }}>{sectionEmoji[s]}</span>
                            <span style={styles.tabLabel}>{s}</span>
                        </button>
                    ))}
                </div>

                <div style={styles.pieceGrid}>
                    {pieces.map(piece => (
                        <button
                            key={piece}
                            style={{
                                ...styles.pieceBtn,
                                ...(pickedPiece === piece ? styles.pieceBtnActive : {}),
                            }}
                            onClick={() => handleSelect(piece)}
                            title={piece}
                        >
                            <svg
                                viewBox={getViewbox(activeSection, piece)}
                                width="52"
                                height="52"
                                style={{ overflow: 'visible', display: 'block' }}
                            >
                                {renderPiece(activeSection, piece)}
                            </svg>
                        </button>
                    ))}
                </div>

                <div style={styles.actions}>
                    <button style={styles.shuffleBtn} onClick={handleShuffle}>
                        Aleatório
                    </button>
                    <button
                        style={{ ...styles.confirmBtn, ...(saving ? styles.confirmDisabled : {}) }}
                        onClick={handleConfirm}
                        disabled={saving}
                    >
                        {saving ? 'Salvando...' : 'Confirmar personagem'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    root: {
        minHeight: '100vh',
        background: '#FFF9F0',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '20px 12px 40px',
        fontFamily: '"Itim", cursive',
        boxSizing: 'border-box',
    },
    card: {
        background: '#ffffff',
        border: '3px solid #1a1a1a',
        borderRadius: 24,
        boxShadow: '7px 7px 0 #1a1a1a',
        padding: '28px 20px 24px',
        width: '100%',
        maxWidth: 520,
        boxSizing: 'border-box',
    },
    title: {
        fontFamily: '"Gochi Hand", cursive',
        fontSize: '1.9rem',
        margin: '0 0 4px',
        color: '#1a1a1a',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: '0.9rem',
        color: '#888',
        margin: '0 0 20px',
        textAlign: 'center',
    },
    previewWrap: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    previewInner: {
        width: 180,
        height: 180,
        borderRadius: '50%',
        border: '3px solid #1a1a1a',
        overflow: 'hidden',
        background: '#FFD55A',
        boxShadow: '4px 4px 0 #1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    colorRow: {
        display: 'flex',
        gap: 24,
        alignItems: 'center',
    },
    colorItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    colorLabel: {
        fontSize: '0.85rem',
        color: '#555',
        fontWeight: 600,
    },
    sectionTabs: {
        display: 'flex',
        gap: 6,
        marginBottom: 16,
        overflowX: 'auto',
        paddingBottom: 4,
        scrollbarWidth: 'none',
    },
    tabBtn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        padding: '8px 10px',
        border: '2.5px solid #ddd',
        borderRadius: 12,
        background: 'white',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'all 0.15s',
        fontFamily: '"Itim", cursive',
        minWidth: 58,
    },
    tabActive: {
        border: '2.5px solid #1a1a1a',
        background: '#1a1a1a',
        color: '#FFD55A',
        boxShadow: '2px 2px 0 #FFD55A, 2px 2px 0 2px #1a1a1a',
    },
    tabLabel: {
        fontSize: '0.65rem',
        lineHeight: 1,
    },
    pieceGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
        gap: 8,
        maxHeight: 260,
        overflowY: 'auto',
        padding: '4px 2px',
        marginBottom: 20,
        scrollbarWidth: 'thin',
    },
    pieceBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        aspectRatio: '1',
        border: '2px solid #e0e0e0',
        borderRadius: 12,
        background: '#fafafa',
        cursor: 'pointer',
        padding: 6,
        boxSizing: 'border-box',
        transition: 'all 0.12s',
        overflow: 'hidden',
    },
    pieceBtnActive: {
        border: '2.5px solid #1a1a1a',
        background: '#FFD55A',
        boxShadow: '2px 2px 0 #1a1a1a',
    },
    actions: {
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
    },
    shuffleBtn: {
        flex: 1,
        minWidth: 100,
        padding: '13px 16px',
        border: '2.5px solid #1a1a1a',
        borderRadius: 12,
        background: 'white',
        cursor: 'pointer',
        fontFamily: '"Itim", cursive',
        fontSize: '0.95rem',
        color: '#1a1a1a',
        transition: 'all 0.15s',
    },
    confirmBtn: {
        flex: 2,
        minWidth: 160,
        padding: '13px 16px',
        border: '2.5px solid #1a1a1a',
        borderRadius: 12,
        background: '#1a1a1a',
        color: '#FFD55A',
        cursor: 'pointer',
        fontFamily: '"Gochi Hand", cursive',
        fontSize: '1.1rem',
        letterSpacing: 0.5,
        boxShadow: '3px 3px 0 #FFD55A, 3px 3px 0 2px #1a1a1a',
        transition: 'all 0.15s',
    },
    confirmDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
        boxShadow: 'none',
    },
};
