import React, { useCallback, useEffect } from "react";
import { AbstractConnector } from "@web3-react/abstract-connector";
import { injected, walletconnect } from "../utils/connectors";
import { Web3Status } from "../providers/Web3ReactManager";
import { useWeb3 } from "../hooks/useWeb3";
import { useModal } from "../hooks/useModal";
import styled from "styled-components";
import { H2, Paragraph } from "./Typography";

const Wrapper = styled.div`
  max-width: 32rem;
  padding: ${(p) => p.theme.spacing.m};
  margin: ${(p) => p.theme.spacing.m} auto;
`;

const Header = styled.header`
  display: grid;
  grid-template-columns: 1fr max-content;
  align-items: baseline;
  margin-bottom: ${(p) => p.theme.spacing.s};
`;

const ConnectButton = styled.button`
  width: 100%;
  display: inline-flex;
  align-items: center;
  padding: ${(p) => p.theme.spacing.s};
  background-color: ${(p) => p.theme.colors.accent};

  &:hover {
    background-color: ${(p) => p.theme.colors.fg};
    color: ${(p) => p.theme.colors.bg};
  }

  &:focus-visible {
    color: ${(p) => p.theme.colors.fg};
    background: ${(p) => p.theme.colors.accent};
    box-shadow: 0 0 0 4px ${(p) => p.theme.colors.fg};
    text-decoration: none;
    outline: none;
  }

  svg {
    width: 1rem;
    margin-right: 1rem;
  }

  & + & {
    margin-top: ${(p) => p.theme.spacing.xs};
  }
`;

export default function Web3ConnectorModal() {
  const { activate, status, error, isWrongNetwork } = useWeb3();
  const { closeModal } = useModal();

  const handleConnect = useCallback(
    (connector: AbstractConnector) => {
      activate(connector);
    },
    [activate]
  );

  useEffect(() => {
    if (status === Web3Status.READY) {
      closeModal();
    }
  }, [status]);

  return (
    <Wrapper>
      <Header>
        <H2>connect wallet</H2>
        <button onClick={closeModal}>close</button>
      </Header>
      <ConnectButton onClick={() => handleConnect(walletconnect)}>
        <WallectConnectLogo /> WalletConnect
      </ConnectButton>
      <ConnectButton onClick={() => handleConnect(injected)}>
        <MetamaskLogo /> Metamask
      </ConnectButton>
      {isWrongNetwork && (
        <Paragraph margin="s 0 0">
          Please connect to the correct network.
        </Paragraph>
      )}
      {error && !isWrongNetwork && (
        <Paragraph margin="s 0 0">
          Something went wrong. Please try again.
        </Paragraph>
      )}
    </Wrapper>
  );
}

function WallectConnectLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <defs>
        <radialGradient cx="0%" cy="50%" fx="0%" fy="50%" r="100%" id="a">
          <stop stopColor="#5D9DF6" offset="0%" />
          <stop stopColor="#006FFF" offset="100%" />
        </radialGradient>
      </defs>
      <g fill="none" fillRule="evenodd">
        <rect fill="url(#a)" width="512" height="512" rx="256" />
        <path
          d="M169.21 184.531c47.933-46.93 125.648-46.93 173.58 0l5.77 5.648a5.92 5.92 0 0 1 0 8.498l-19.735 19.321a3.115 3.115 0 0 1-4.34 0l-7.938-7.773c-33.439-32.74-87.655-32.74-121.094 0l-8.502 8.324a3.115 3.115 0 0 1-4.34 0l-19.733-19.321a5.92 5.92 0 0 1 0-8.498l6.332-6.199Zm214.392 39.958 17.563 17.196a5.92 5.92 0 0 1 0 8.498l-79.193 77.539c-2.397 2.346-6.283 2.346-8.68 0l-56.207-55.032a1.558 1.558 0 0 0-2.17 0l-56.205 55.032c-2.397 2.346-6.283 2.346-8.68 0l-79.195-77.54a5.92 5.92 0 0 1 0-8.498l17.563-17.196c2.396-2.346 6.282-2.346 8.679 0l56.208 55.033c.599.586 1.57.586 2.17 0l56.205-55.033c2.396-2.346 6.282-2.346 8.679 0l56.208 55.033c.599.586 1.57.586 2.17 0l56.206-55.032c2.397-2.346 6.283-2.346 8.68 0Z"
          fill="#FFF"
          fillRule="nonzero"
        />
      </g>
    </svg>
  );
}

function MetamaskLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      x="0"
      y="0"
      version="1.1"
      viewBox="0 0 318.6 318.6"
    >
      <path
        fill="#e2761b"
        stroke="#e2761b"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m274.1 35.5-99.5 73.9L193 65.8z"
      />
      <path
        d="m44.4 35.5 98.7 74.6-17.5-44.3zM238.3 206.8l-26.5 40.6 56.7 15.6 16.3-55.3zM33.9 207.7 50.1 263l56.7-15.6-26.5-40.6z"
        fill="#e4761b"
        stroke="#e4761b"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m103.6 138.2-15.8 23.9 56.3 2.5-2-60.5zM214.9 138.2l-39-34.8-1.3 61.2 56.2-2.5zM106.8 247.4l33.8-16.5-29.2-22.8zM177.9 230.9l33.9 16.5-4.7-39.3z"
        fill="#e4761b"
        stroke="#e4761b"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m211.8 247.4-33.9-16.5 2.7 22.1-.3 9.3zM106.8 247.4l31.5 14.9-.2-9.3 2.5-22.1z"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#d7c1b3"
        stroke="#d7c1b3"
      />
      <path
        d="m138.8 193.5-28.2-8.3 19.9-9.1zM179.7 193.5l8.3-17.4 20 9.1z"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#233447"
        stroke="#233447"
      />
      <path
        d="m106.8 247.4 4.8-40.6-31.3.9zM207 206.8l4.8 40.6 26.5-39.7zM230.8 162.1l-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zM110.6 185.2l20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#cd6116"
        stroke="#cd6116"
      />
      <g>
        <path
          d="m87.8 162.1 23.6 46-.8-22.9zM208.1 185.2l-1 22.9 23.7-46zM144.1 164.6l-5.3 28.9 6.6 34.1 1.5-44.9zM174.6 164.6l-2.7 18 1.2 45 6.7-34.1z"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#e4751f"
          stroke="#e4751f"
        />
      </g>
      <path
        d="m179.8 193.5-6.7 34.1 4.8 3.3 29.2-22.8 1-22.9zM110.6 185.2l.8 22.9 29.2 22.8 4.8-3.3-6.6-34.1z"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#f6851b"
        stroke="#f6851b"
      />
      <path
        fill="#c0ad9e"
        stroke="#c0ad9e"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m180.3 262.3.3-9.3-2.5-2.2h-37.7l-2.3 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9z"
      />
      <path
        fill="#161616"
        stroke="#161616"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m177.9 230.9-4.8-3.3h-27.7l-4.8 3.3-2.5 22.1 2.3-2.2h37.7l2.5 2.2z"
      />
      <g>
        <path
          d="m278.3 114.2 8.5-40.8-12.7-37.9-96.2 71.4 37 31.3 52.3 15.3 11.6-13.5-5-3.6 8-7.3-6.2-4.8 8-6.1zM31.8 73.4l8.5 40.8-5.4 4 8 6.1-6.1 4.8 8 7.3-5 3.6 11.5 13.5 52.3-15.3 37-31.3-96.2-71.4z"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#763d16"
          stroke="#763d16"
        />
      </g>
      <path
        d="m267.2 153.5-52.3-15.3 15.9 23.9-23.7 46 31.2-.4h46.5zM103.6 138.2l-52.3 15.3-17.4 54.2h46.4l31.1.4-23.6-46zM174.6 164.6l3.3-57.7 15.2-41.1h-67.5l15 41.1 3.5 57.7 1.2 18.2.1 44.8h27.7l.2-44.8z"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#f6851b"
        stroke="#f6851b"
      />
    </svg>
  );
}
