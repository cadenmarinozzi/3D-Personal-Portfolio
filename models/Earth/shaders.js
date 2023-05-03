const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
  
    void main() {
        vNormal = normalize( normalMatrix * normal );

        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        vPosition = gl_Position.xyz;
    }
`;

const fragmentShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
        vec3 lightPosition = vec3(-10.0, 10.0, 0.0);
        vec3 lightDirection = normalize(lightPosition - vPosition);
        float dotNL = clamp(dot(lightDirection, vNormal), 0.0, 1.0);
        float intensity = min(1.0, pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 2.0 ));
        gl_FragColor = vec4( 120.0 / 255.0, 120.0 / 255.0, 218.0 / 255.0, 1.0 ) * intensity * dotNL;
    }
`;

export default {
  atmosphere: {
    vertexShader,
    fragmentShader,
  },
};
