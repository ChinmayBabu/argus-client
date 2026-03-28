import { useDashboardStore } from '../../stores/dashboardStore';
import './BlockchainPanel.css';

export default function BlockchainPanel() {
  const blockchain = useDashboardStore((state) => state.blockchain);
  const blockchainHistory = useDashboardStore((state) => state.blockchainHistory);

  if (!blockchain) {
    return (
      <div className="blockchain-panel">
        <div className="blockchain-header">
          <span>Blockchain Verification</span>
          <span className="verification-status pending">WAITING</span>
        </div>
        <div className="blockchain-empty">
          <div className="blockchain-icon">⛓️</div>
          <p>Waiting for telemetry data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blockchain-panel">
      <div className="blockchain-header">
        <span>Blockchain Verification</span>
        <span className={`verification-status ${blockchain.is_verified ? 'verified' : 'pending'}`}>
          {blockchain.is_verified ? 'VERIFIED' : 'PENDING'}
        </span>
      </div>

      <div className="blockchain-content">
        <div className="verification-row">
          <span className="ver-label">Storage Mode</span>
          <span className="ver-value">{(blockchain.storage_mode || 'local').toUpperCase()}</span>
        </div>

        <div className="verification-row">
          <span className="ver-label">Integrity Score</span>
          <div className="integrity-meter">
            <div
              className="integrity-fill"
              style={{
                width: `${blockchain.integrity_score * 100}%`,
                background: getIntegrityColor(blockchain.integrity_score),
              }}
            />
          </div>
          <span className="ver-value" style={{ color: getIntegrityColor(blockchain.integrity_score) }}>
            {(blockchain.integrity_score * 100).toFixed(1)}%
          </span>
        </div>

        {typeof blockchain.block_number === 'number' && (
          <div className="hash-row">
            <span className="hash-label">Block Number</span>
            <code className="hash-value">#{blockchain.block_number}</code>
          </div>
        )}

        {blockchain.block_hash && (
          <div className="hash-row">
            <span className="hash-label">Block Hash</span>
            <code className="hash-value">{truncateHash(blockchain.block_hash)}</code>
          </div>
        )}

        {blockchain.transaction_hash && (
          <div className="hash-row">
            <span className="hash-label">Transaction</span>
            <code className="hash-value">{truncateHash(blockchain.transaction_hash)}</code>
          </div>
        )}

        {blockchain.payload_hash && (
          <div className="hash-row">
            <span className="hash-label">Payload Hash</span>
            <code className="hash-value">{truncateHash(blockchain.payload_hash)}</code>
          </div>
        )}

        <div className="verification-row">
          <span className="ver-label">Last Verified</span>
          <span className="ver-value">
            {new Date(blockchain.verification_time * 1000).toLocaleTimeString()}
          </span>
        </div>

        {blockchainHistory.length > 0 && (
          <div className="chain-nodes">
            <div className="chain-nodes-title">Latest Chain Nodes (Top 3)</div>
            <div className="chain-node-list">
              {blockchainHistory.slice(0, 3).map((node, idx) => (
                <div className="chain-node" key={getNodeKey(node, idx)}>
                  <div className="chain-node-head">
                    <span className="chain-node-index">{getNodePrimaryLabel(node)}</span>
                    <span className={`chain-node-status ${node.is_verified ? 'verified' : 'pending'}`}>
                      {node.is_verified ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </div>
                  <code className="chain-node-hash">{getNodeHashText(node)}</code>
                  {node.transaction_hash && (
                    <code className="chain-node-tx">tx: {truncateHash(node.transaction_hash)}</code>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getNodeKey(node: { block_number?: number; block_hash?: string; transaction_hash?: string; verification_time: number }, idx: number): string {
  if (typeof node.block_number === 'number') return `n-${node.block_number}`;
  if (node.block_hash) return `h-${node.block_hash}`;
  if (node.transaction_hash) return `t-${node.transaction_hash}`;
  return `v-${node.verification_time}-${idx}`;
}

function getNodePrimaryLabel(node: { block_number?: number; block_hash?: string; payload_hash?: string }): string {
  if (typeof node.block_number === 'number') return `#${node.block_number}`;
  if (node.block_hash) return `hash: ${node.block_hash.slice(0, 10)}...`;
  if (node.payload_hash) return `payload: ${node.payload_hash.slice(0, 10)}...`;
  return '#-';
}

function getNodeHashText(node: { block_hash?: string; payload_hash?: string }): string {
  if (node.block_hash) return `block: ${truncateHash(node.block_hash)}`;
  if (node.payload_hash) return `payload: ${truncateHash(node.payload_hash)}`;
  return 'hash unavailable';
}

function truncateHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function getIntegrityColor(score: number): string {
  if (score >= 0.9) return '#4ade80';
  if (score >= 0.7) return '#fbbf24';
  if (score >= 0.5) return '#fb923c';
  return '#ef4444';
}
