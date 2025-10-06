import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { siGithub } from 'simple-icons';

export default function GithubIcon({ size = 24, color = '#000', ...props }) {
    return (
        <Svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            {...props}
        >
            <Path d={siGithub.path} fill={color} />
        </Svg>
    );
}
