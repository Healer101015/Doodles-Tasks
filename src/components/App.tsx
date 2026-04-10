import React, { useState } from "react";
import Peep from "react-peeps";
import { useProvider } from "../utils/contextProvider";
import { adjustPeepsViewbox } from "../utils/viewbox";
import LeftMenu from "./leftMenu";
import RightMenu from "./rightMenu";
import { Footer } from "./footer";

export const PeepsGenerator: React.FC = () => {
    const { state, dispatch } = useProvider();
    const [taskText, setTaskText] = useState("");

    const {
        pickedAccessory, pickedBody, pickedFace, pickedFacialHair, pickedHair,
        strokeColor, scaleVector, svgTransform, isFrameTransparent,
        backgroundBasicColor, isCharacterCreated, tasks
    } = state;

    const handleFinish = () => dispatch({ type: 'SET_CHARACTER_CREATED', payload: true });

    const addTask = () => {
        if (!taskText.trim()) return;
        dispatch({
            type: 'ADD_TASK',
            payload: { id: Date.now().toString(), text: taskText, completed: false }
        });
        setTaskText("");
    };

    return (
        <div className={`main-layout ${isCharacterCreated ? 'tasks-active' : ''}`}>
            <div className='container'>
                <div className="header-section">
                    <h1>{isCharacterCreated ? "Minhas Tarefas" : "Crie seu Personagem"}</h1>
                </div>

                <div className={`svgWrapper ${isCharacterCreated ? 'mini-avatar' : ''}`}>
                    <Peep
                        style={{
                            width: isCharacterCreated ? 180 : 390,
                            height: isCharacterCreated ? 180 : 390,
                            transition: "all 0.4s ease-in-out"
                        }}
                        accessory={pickedAccessory}
                        body={pickedBody}
                        face={pickedFace}
                        hair={pickedHair}
                        facialHair={pickedFacialHair}
                        strokeColor={strokeColor}
                        viewBox={adjustPeepsViewbox(pickedBody)}
                        wrapperBackground={isFrameTransparent ? undefined : (backgroundBasicColor as string)}
                    />
                    {!isCharacterCreated && (
                        <button className="confirm-btn" onClick={handleFinish}>
                            Confirmar Personagem
                        </button>
                    )}
                </div>

                {!isCharacterCreated ? (
                    <>
                        <LeftMenu />
                        <RightMenu />
                    </>
                ) : (
                    <div className="task-container">
                        <div className="task-input-group">
                            <input
                                type="text"
                                value={taskText}
                                onChange={(e) => setTaskText(e.target.value)}
                                placeholder="O que você precisa fazer?"
                            />
                            <button onClick={addTask}>Adicionar</button>
                        </div>

                        <div className="task-list">
                            {tasks.map(task => (
                                <div key={task.id} className={`task-item ${task.completed ? 'done' : ''}`}>
                                    <span onClick={() => dispatch({ type: 'TOGGLE_TASK', payload: task.id })}>
                                        {task.text}
                                    </span>
                                    <button onClick={() => dispatch({ type: 'REMOVE_TASK', payload: task.id })}>×</button>
                                </div>
                            ))}
                        </div>

                        <button className="edit-btn" onClick={() => dispatch({ type: 'SET_CHARACTER_CREATED', payload: false })}>
                            Voltar para Edição
                        </button>
                    </div>
                )}
                <Footer />
            </div>
        </div>
    );
};