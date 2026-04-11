import React from "react";

export const Footer = () => {
    return (
        <div className='footer'>
            <div className='signature'>
                <span className='sign-animation boldText'>
                    Doodle Tasks • Desenvolvido por João Henrique, Douglas Santos e Mariana De Oliveira
                </span>

                <span style={{ fontSize: "0.9em", margin: "0 6px" }}>•</span>

                <span className='support-me'>
                    © {new Date().getFullYear()} Todos os direitos reservados
                </span>
            </div>
        </div>
    );
};