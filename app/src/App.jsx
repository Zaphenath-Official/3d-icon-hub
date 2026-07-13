import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [activeModal, setActiveModal] = useState(null); // 'copy' | 'download' | null
  const [assetMode, setAssetMode] = useState('flat'); // 'flat' | '3d'
  const [inputText, setInputText] = useState('');

  const SEED_DATA = {
    flat: [
      {
        id: "variant-0",
        label: "Geometric Base Variant",
        rawCode: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\\n  <circle cx="50" cy="50" r="45" fill="#a8c7fa" />\\n  <polygon points="50,20 80,75 20,75" fill="#131314" />\\n</svg>`,
        htmlRender: (
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="#a8c7fa" />
            <polygon points="50,20 80,75 20,75" fill="#131314" />
          </svg>
        ),
        docs: "Incorporate inline into any web app framework. Scales seamlessly across responsive grids."
      },
      {
        id: "variant-1",
        label: "Abstract Wire Frame",
        rawCode: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\\n  <rect x="15" y="15" width="70" height="70" rx="10" fill="none" stroke="#a8c7fa" stroke-width="4" />\\n  <circle cx="50" cy="50" r="20" fill="#a8c7fa" />\\n</svg>`,
        htmlRender: (
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="15" width="70" height="70" rx="10" fill="none" stroke="#a8c7fa" stroke-width="4" />
            <circle cx="50" cy="50" r="20" fill="#a8c7fa" />
          </svg>
        ),
        docs: "Minimalist outline variant. Ensure the wrapping container inherits parent color dimensions."
      },
      {
        id: "variant-2",
        label: "Dynamic Array Pattern",
        rawCode: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\\n  <path d="M10,50 Q50,0 90,50 T10,50" fill="#a8c7fa" opacity="0.8"/>\\n</svg>`,
        htmlRender: (
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M10,50 Q50,0 90,50 T10,50" fill="#a8c7fa" opacity="0.8"/>
          </svg>
        ),
        docs: "Fluid vector configuration pathing. Optimized for accent badges or icon overlays."
      }
    ],
    "3d": [
      {
        id: "variant-3d-0",
        label: "Procedural Isometric Orb",
        rawCode: `import bpy\\n\\n# Initialize high-poly sphere\\nbpy.ops.mesh.primitive_uv_sphere_add(radius=1.5, location=(0,0,0))\\nobj = bpy.context.active_object\\n\\n# Apply smooth shading interpolation\\nbpy.ops.object.shade_smooth()`,
        htmlRender: (
          <div className="threed-placeholder-mesh">
            <div style={{fontSize: '56px', marginBottom: '12px'}}>🔮</div>
            <p>Procedural Orb Model</p>
          </div>
        ),
        docs: "Run inside Blender Text Editor runtime. Ready for subdivision modifiers and standard PBR baking loops."
      },
      {
        id: "variant-3d-1",
        label: "Hard Surface Monolith",
        rawCode: `import bpy\\n\\n# Initialize hard-surface cuboid primitives\\nbpy.ops.mesh.primitive_cube_add(size=2.0, location=(0,0,1))\\nobj = bpy.context.active_object\\n\\n# Extrude face layers along normal vectors\\nobj.scale = (1.0, 1.0, 2.5)`,
        htmlRender: (
          <div className="threed-placeholder-mesh">
            <div style={{fontSize: '56px', marginBottom: '12px'}}>💎</div>
            <p>Monolith Grid Mesh</p>
          </div>
        ),
        docs: "Low-poly baseline construct. Best used with edge chamfer tools for optimized hard-surface scene layouts."
      },
      {
        id: "variant-3d-2",
        label: "Conical Array Core",
        rawCode: `import bpy\\n\\n# Initialize radial cone geometry\\nbpy.ops.mesh.primitive_cone_add(radius1=1.2, depth=3.0)\\nobj = bpy.context.active_object`,
        htmlRender: (
          <div className="threed-placeholder-mesh">
            <div style={{fontSize: '56px', marginBottom: '12px'}}>📐</div>
            <p>Radial Cone Primitive</p>
          </div>
        ),
        docs: "Export clean mesh vertex loops. Direct compatibility parameters for standard engine transformation matrices."
      }
    ]
  };

  const activeDeck = SEED_DATA[assetMode];

  const rotateDeckPosition = (direction) => {
    if (direction === 'next') {
      setCurrentViewIndex((prev) => (prev + 1) % activeDeck.length);
    } else {
      setCurrentViewIndex((prev) => (prev - 1 + activeDeck.length) % activeDeck.length);
    }
  };

  return (
    <div className="app-container">
      
      {/* Top Header Row Header with Explicit Segmented Control Toggle */}
      <header className="top-header">
        <div className="brand-wrapper">
          <span className="brand-logo">✨</span>
          <span className="brand-name">IcoGen</span>
        </div>

        {/* Top Center Segmented Asset Selection Control */}
        <div className="top-toggle-container">
          <button 
            className={`toggle-option-pill ${assetMode === 'flat' ? 'active' : ''}`}
            onClick={() => { setAssetMode('flat'); setCurrentViewIndex(0); }}
          >
            Flat Icon
          </button>
          <button 
            className={`toggle-option-pill ${assetMode === '3d' ? 'active' : ''}`}
            onClick={() => { setAssetMode('3d'); setCurrentViewIndex(0); }}
          >
            3D Icon
          </button>
        </div>
        
        {/* Mirror element to preserve CSS flex layout symmetry balance */}
        <div style={{ width: '100px' }}></div>
      </header>

      {/* Main Chat Stream Viewport Area */}
      <main className="chat-stream-viewport">
        
        <div className="prompt-card">
          <div className="prompt-user-label">You</div>
          <div className="prompt-text-payload">
            Generate a set of premium minimalistic icons for a designer portfolio system. 
            Currently previewing in <strong style={{color: '#a8c7fa'}}>{assetMode.toUpperCase()}</strong> format configurations.
          </div>
        </div>

        <div className="response-block-group">
          <div className="response-ai-label">IcoGen Architect</div>
          
          <div className="response-layout-wrapper">
            
            {/* Left Hand Action Ports (Cleaned up temporary switcher button) */}
            <div className="action-vertical-bar">
              <button className="action-icon-button" title="Copy Code" onClick={() => setActiveModal('copy')}>
                <span className="material-symbols-outlined">content_copy</span>
              </button>
              <button className="action-icon-button" title="Download Asset File" onClick={() => setActiveModal('download')}>
                <span className="material-symbols-outlined">download</span>
              </button>
            </div>

            {/* Fanned Asset Deck Interface */}
            <div className="deck-stack-container">
              {activeDeck.map((asset, index) => {
                const layoutOffset = (index - currentViewIndex + activeDeck.length) % activeDeck.length;
                const indexClass = `idx-${layoutOffset}`;

                return (
                  <div key={asset.id} className={`asset-deck-card ${indexClass}`}>
                    <div className="asset-render-frame">
                      {asset.htmlRender}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Interactive Navigation Dot Array Dashboard */}
          <div className="deck-navigation-bar">
            <button className="nav-arrow-trigger" onClick={() => rotateDeckPosition('prev')}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back_ios</span>
            </button>
            <div className="dot-indicators-group">
              {activeDeck.map((_, index) => (
                <button
                  key={index}
                  className={`indicator-dot ${index === currentViewIndex ? 'active' : ''}`}
                  onClick={() => setCurrentViewIndex(index)}
                />
              ))}
            </div>
            <button className="nav-arrow-trigger" onClick={() => rotateDeckPosition('next')}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward_ios</span>
            </button>
          </div>

        </div>
      </main>

      {/* Re-engineered High-Profile Expanded Input Workspace Footer */}
      <footer className="chat-input-fixed-footer">
        <div className="input-bar-container large-profile">
          <textarea 
            className="prompt-textarea-field multi-line" 
            placeholder="Describe the asset variations you want to create..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="input-footer-control-row">
            <span className="footer-system-status">Ready for engine pipeline generation</span>
            <button className="send-action-button active-accent">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </footer>

      {/* --- Overlay Modals Layer Framework --- */}

      {/* Copy Asset Overlay View */}
      {activeModal === 'copy' && (
        <div className="modal-window-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title-row">
              <h3>Source Code Structure ({assetMode === 'flat' ? 'SVG Vector' : 'Blender Python Script'})</h3>
              <button className="close-modal-x" onClick={() => setActiveModal(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <p style={{fontSize: '14px', color: 'var(--text-muted)'}}>{activeDeck[currentViewIndex].label}</p>
            
            <div className="ide-code-terminal">
              {assetMode === 'flat' ? (
                <>
                  <span className="token-comment">&lt;!-- Generated by IcoGen Model Matrix --&gt;</span><br />
                  <span className="token-tag">&lt;svg</span> <span className="token-attr">viewBox</span>=<span className="token-str">"0 0 100 100"</span> <span className="token-attr">xmlns</span>=<span className="token-str">"http://www.w3.org/2000/svg"</span><span className="token-tag">&gt;</span><br />
                  &nbsp;&nbsp;<span className="token-tag">&lt;circle</span> <span className="token-attr">cx</span>=<span className="token-str">"50"</span> <span className="token-attr">cy</span>=<span className="token-str">"50"</span> <span className="token-attr">r</span>=<span className="token-str">"45"</span> <span className="token-attr">fill</span>=<span className="token-str">"#a8c7fa"</span> <span className="token-tag">/&gt;</span><br />
                  <span className="token-tag">&lt;/svg&gt;</span>
                </>
              ) : (
                <>
                  <span className="token-keyword">import</span> bpy<br /><br />
                  <span className="token-comment"># Engine execution blocks</span><br />
                  bpy.ops.mesh.primitive_uv_sphere_add(<span className="token-attr">radius</span>=<span className="token-str">1.5</span>)
                </>
              )}
            </div>

            <h4>Implementation Integration Instructions</h4>
            <div className="documentation-block-note">
              {activeDeck[currentViewIndex].docs}
            </div>

            <div className="modal-actions-layout">
              <button className="btn-secondary" onClick={() => setActiveModal(null)}>Dismiss</button>
              <button className="btn-primary" onClick={() => { alert('Code copied to dynamic workspace clipboard buffer!'); setActiveModal(null); }}>
                Copy Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Direct Confirmation Overlay View */}
      {activeModal === 'download' && (
        <div className="modal-window-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-content-card" style={{maxWidth: '440px'}} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title-row">
              <h3>Confirm Local Export</h3>
              <button className="close-modal-x" onClick={() => setActiveModal(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p style={{lineHeight: '1.6'}}>
              You are about to compile and download <strong>{activeDeck[currentViewIndex].label}</strong> as a structural 
              <strong style={{color: 'var(--accent-blue)'}}> {assetMode === 'flat' ? '.svg' : '.gltf'}</strong> asset format file to your local device machine.
            </p>
            
            <div className="modal-actions-layout">
              <button className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => { alert(`Initiating direct compilation hook download for: icon_asset_${currentViewIndex}.${assetMode === 'flat' ? 'svg' : 'gltf'}`); setActiveModal(null); }}>
                Confirm and Download
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}