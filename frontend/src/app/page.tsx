"use client";

import React, { useEffect, useRef, useState } from 'react';

// Interfaces for our MTO
interface DrawingMeta {
  drawing_no: string;
  revision: string;
  line_number: string;
  nps: string;
  material_class: string;
  service: string;
}

interface MTOItem {
  item_no: number;
  category: string;
  description: string;
  size_nps: string;
  schedule_rating: string;
  material_spec: string;
  end_type: string;
  quantity: number;
  unit: string;
  length_m: number | null;
  confidence: number;
  remarks: string;
}

interface MTOSummary {
  total_pipe_length_m: number;
  fittings: number;
  flanges: number;
  valves: number;
  gaskets: number;
  bolt_sets: number;
  field_welds: number;
}

interface MTO {
  drawing_meta: DrawingMeta;
  items: MTOItem[];
  summary: MTOSummary;
}

const SAMPLE_SVG = `
  <svg viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg" style="background:#0b1424; width: 100%; height: auto; display: block;">
    <defs>
      <linearGradient id="pipeGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#4fb8d6"/>
        <stop offset="1" stop-color="#7d7ad1"/>
      </linearGradient>
    </defs>
    <text x="18" y="26" fill="#8593a8" font-family="JetBrains Mono, monospace" font-size="10">DWG NO: ISO-1501-01   REV: 2</text>
    <text x="18" y="40" fill="#8593a8" font-family="JetBrains Mono, monospace" font-size="10">LINE: 6"-P-1501-A1A-IH</text>
    <polyline points="60,300 60,220 140,170 140,110 220,60 320,60 320,120 400,150" fill="none" stroke="url(#pipeGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="60" cy="300" r="5" fill="#4fb8d6"/>
    <circle cx="140" cy="170" r="5" fill="#4fb8d6"/>
    <circle cx="220" cy="60" r="5" fill="#4fb8d6"/>
    <circle cx="320" cy="60" r="5" fill="#4fb8d6"/>
    <g transform="translate(320,120)">
      <polygon points="-10,-8 -10,8 10,0" fill="#d97a94" opacity="0.9"/>
      <polygon points="10,-8 10,8 -10,0" fill="#d97a94" opacity="0.9"/>
    </g>
    <line x1="392" y1="142" x2="392" y2="158" stroke="#e0a458" stroke-width="4"/>
    <text x="70" y="315" fill="#57657c" font-family="JetBrains Mono, monospace" font-size="9">EL. +100000</text>
    <text x="150" y="200" fill="#57657c" font-family="JetBrains Mono, monospace" font-size="9">3800</text>
    <text x="225" y="52" fill="#57657c" font-family="JetBrains Mono, monospace" font-size="9">FW</text>
    <text x="330" y="200" fill="#57657c" font-family="JetBrains Mono, monospace" font-size="9">N ↑</text>
    <g class="det-layer" id="detLayer">
      <rect x="30" y="270" width="60" height="46" rx="6" fill="none" stroke="#4fb8d6" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="34" y="264" fill="#4fb8d6" font-family="JetBrains Mono, monospace" font-size="8">PIPE 94%</text>
      <rect x="110" y="145" width="60" height="50" rx="6" fill="none" stroke="#7d7ad1" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="112" y="140" fill="#7d7ad1" font-family="JetBrains Mono, monospace" font-size="8">ELBOW 90%</text>
      <rect x="192" y="34" width="56" height="50" rx="6" fill="none" stroke="#7d7ad1" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="194" y="28" fill="#7d7ad1" font-family="JetBrains Mono, monospace" font-size="8">TEE 81%</text>
      <rect x="296" y="94" width="56" height="52" rx="6" fill="none" stroke="#d97a94" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="298" y="152" fill="#d97a94" font-family="JetBrains Mono, monospace" font-size="8">VALVE 85%</text>
      <rect x="370" y="130" width="28" height="34" rx="6" fill="none" stroke="#e0a458" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="366" y="176" fill="#e0a458" font-family="JetBrains Mono, monospace" font-size="8">FLANGE 88%</text>
    </g>
  </svg>
`;

export default function Home() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  const [activeView, setActiveView] = useState<'upload' | 'processing' | 'results'>('upload');
  
  // File upload state
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Processing state
  const [logs, setLogs] = useState<{tag: string, msg: string}[]>([]);
  const [progressPct, setProgressPct] = useState(0);
  const [progressStatus, setProgressStatus] = useState('Starting...');
  const [activeNode, setActiveNode] = useState(0); // 0=none, 1=preprocess, 2=vision, 3=validate, 4=derive
  const logTerminalRef = useRef<HTMLDivElement>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [mtoData, setMtoData] = useState<MTO | null>(null);
  
  // Results state
  const [showDetections, setShowDetections] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);
  
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '1';
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
      }
      
      document.querySelectorAll('.glass').forEach(el => {
        const card = el as HTMLElement;
        const r = card.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          const mx = ((e.clientX - r.left) / r.width) * 100;
          const my = ((e.clientY - r.top) / r.height) * 100;
          card.style.setProperty('--mx', mx + '%');
          card.style.setProperty('--my', my + '%');
        }
      });
    };
    const handleMouseLeave = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = '0';
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (!jobId || isDemo) return;
    
    let interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/status/${jobId}`);
        const data = await res.json();
        
        if (data.logs) {
          setLogs(data.logs);
          
          // Heuristic to update active node based on logs
          const strLogs = JSON.stringify(data.logs);
          if (strLogs.includes('[derive]')) setActiveNode(4);
          else if (strLogs.includes('[validate]')) setActiveNode(3);
          else if (strLogs.includes('[vision]')) setActiveNode(2);
          else if (strLogs.includes('[preprocess]')) setActiveNode(1);
          
          setProgressPct(Math.min(95, data.logs.length * 5));
        }
        
        if (data.status === 'completed') {
          clearInterval(interval);
          const mtoRes = await fetch(`${API_BASE}/api/mto/${jobId}`);
          const mtoDataRes = await mtoRes.json();
          setMtoData(mtoDataRes.data);
          setProgressPct(100);
          setProgressStatus('Complete');
          setActiveNode(4);
          setTimeout(() => {
            setActiveView('results');
            showToast('MTO generated');
          }, 600);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setProgressStatus('Failed');
        }
      } catch(e) {
        console.error(e);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [jobId, isDemo]);

  const handleFile = async (file: File) => {
    setErrorMsg('');
    const okTypes = ['image/png','image/jpeg','application/pdf'];
    if (!okTypes.includes(file.type)) { setErrorMsg('Unsupported file type. Please upload a PNG, JPG or PDF.'); return; }
    if (file.size > 20*1024*1024) { setErrorMsg('File exceeds the 20MB limit. Please upload a smaller drawing.'); return; }
    
    setIsDemo(false);
    setUploadedFileType(file.type);
    setUploadedImageUrl(URL.createObjectURL(file));
    
    setActiveView('processing');
    setLogs([]);
    setProgressPct(0);
    setProgressStatus('Uploading...');
    
    // Call backend API
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setJobId(data.job_id);
        setProgressStatus('Processing...');
      } else {
        setErrorMsg(data.detail || 'Upload failed');
        setActiveView('upload');
      }
    } catch(e) {
      setErrorMsg('Network error communicating with backend');
      setActiveView('upload');
    }
  };
  
  const runDemoPipeline = () => {
    setIsDemo(true);
    setUploadedImageUrl(null);
    setActiveView('processing');
    setLogs([]);
    setProgressPct(0);
    setProgressStatus('Starting...');
    setActiveNode(1);
    
    const LOG_SCRIPT = [
      ['info', '[upload] receiving file · validating content-type & size'],
      ['ok',   '[upload] file accepted -> job_id: 8f2c1a'],
      ['info', '[preprocess] rendering page 1 -> PNG @ 300dpi'],
      ['info', '[preprocess] normalizing contrast, deskewing isometric grid'],
      ['ok',   '[preprocess] image ready for extraction (2480x1748)'],
      ['info', '[vision] calling gemini-2.5-flash with structured JSON schema'],
      ['info', '[vision] parsing title block: drawing no. / line no. / revision'],
      ['info', '[vision] tracing pipe route + detecting symbols (elbow, tee, flange, valve)'],
      ['ok',   '[vision] extraction complete -> 9 items detected'],
      ['info', '[validate] checking response against Pydantic MTO schema'],
      ['info', '[validate] normalizing units -> NPS in inches, length in metres'],
      ['warn', '[validate] no explicit gasket/bolt rows found - deriving from flanged joints'],
      ['ok',   '[validate] schema valid - 0 errors'],
      ['info', '[derive] computing summary totals (length, counts, field welds)'],
      ['ok',   '[derive] MTO ready - 11 rows, 4 categories'],
    ];
    
    let i = 0;
    const tick = () => {
      if (i >= LOG_SCRIPT.length) {
        setProgressPct(100);
        setProgressStatus('Complete');
        setActiveNode(5);
        setTimeout(() => {
          setMtoData({
            drawing_meta: { drawing_no: 'ISO-1501-01', revision: '2', line_number: '6"-P-1501-A1A-IH', nps: '6"', material_class: 'A1A', service: 'Process' },
            items: [
              { item_no:1, category:'PIPE', description:'Pipe, Seamless, BE, ASME B36.10', size_nps:'6"', schedule_rating:'SCH 40', material_spec:'ASTM A106 Gr.B', end_type:'BW', quantity:1, unit:'M', length_m:12.45, confidence:0.94, remarks:'' },
              { item_no:2, category:'FITTING', description:'Elbow 90° LR, BW, ASME B16.9', size_nps:'6"', schedule_rating:'SCH 40', material_spec:'ASTM A234 WPB', end_type:'BW', quantity:3, unit:'EA', length_m:null, confidence:0.9, remarks:'' },
              { item_no:3, category:'FITTING', description:'Tee, Equal, BW, ASME B16.9', size_nps:'6"', schedule_rating:'SCH 40', material_spec:'ASTM A234 WPB', end_type:'BW', quantity:1, unit:'EA', length_m:null, confidence:0.81, remarks:'' },
              { item_no:4, category:'FITTING', description:'Reducer, Concentric, BW, ASME B16.9', size_nps:'6"x4"', schedule_rating:'SCH 40', material_spec:'ASTM A234 WPB', end_type:'BW', quantity:1, unit:'EA', length_m:null, confidence:0.77, remarks:'' },
              { item_no:5, category:'FLANGE', description:'Flange, Weld-Neck, RF, ASME B16.5', size_nps:'6"', schedule_rating:'CL150', material_spec:'ASTM A105', end_type:'BW', quantity:2, unit:'EA', length_m:null, confidence:0.88, remarks:'' },
              { item_no:6, category:'VALVE', description:'Gate Valve, Flanged, RF', size_nps:'6"', schedule_rating:'CL150', material_spec:'ASTM A216 WCB', end_type:'FLGD', quantity:1, unit:'EA', length_m:null, confidence:0.85, remarks:'' },
              { item_no:7, category:'GASKET', description:'Gasket, Spiral Wound, SS316/Graphite, ASME B16.20', size_nps:'6"', schedule_rating:'CL150', material_spec:'SS316/Graphite', end_type:'FLGD', quantity:2, unit:'EA', length_m:null, confidence:0.72, remarks:'derived from flanged joints' },
              { item_no:8, category:'BOLT', description:'Stud Bolt w/ 2 Nuts, ASTM A193 B7 / A194 2H', size_nps:'3/4"', schedule_rating:'CL150', material_spec:'A193 B7 / A194 2H', end_type:'-', quantity:2, unit:'SET', length_m:null, confidence:0.7, remarks:'derived from flanged joints' },
              { item_no:9, category:'FITTING', description:'Cap, BW, ASME B16.9', size_nps:'4"', schedule_rating:'SCH 40', material_spec:'ASTM A234 WPB', end_type:'BW', quantity:1, unit:'EA', length_m:null, confidence:0.68, remarks:'' },
            ],
            summary: {
              total_pipe_length_m: 12.45, fittings: 5, flanges: 2, valves: 1, gaskets: 2, bolt_sets: 2, field_welds: 1
            }
          });
          setActiveView('results');
          showToast('MTO generated');
        }, 600);
        return;
      }
      
      const [tag, text] = LOG_SCRIPT[i];
      setLogs(prev => [...prev, {tag, msg: text}]);
      
      if (i >= 0 && i < 5) setActiveNode(1);
      else if (i >= 5 && i < 9) setActiveNode(2);
      else if (i >= 9 && i < 13) setActiveNode(3);
      else if (i >= 13) setActiveNode(4);
      
      const pct = Math.round(((i+1)/LOG_SCRIPT.length)*100);
      setProgressPct(pct);
      setProgressStatus(tag === 'warn' ? 'Working - minor fallback applied' : 'Processing...');
      
      i++;
      setTimeout(tick, 320 + Math.random()*240);
    };
    tick();
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4200);
  };
  
  const handleDownloadCsv = () => {
    if (jobId && !isDemo) {
      window.location.href = `${API_BASE}/api/mto/${jobId}/csv`;
    } else {
      showToast('Export works for live API jobs');
    }
  };

  const handleDownloadExcel = () => {
    if (jobId && !isDemo) {
      window.location.href = `${API_BASE}/api/mto/${jobId}/excel`;
    } else {
      showToast('Export works for live API jobs');
    }
  };

  const getStepClass = (stepNum: number) => {
    let currentStep = 1; // upload
    if (activeView === 'processing') {
      currentStep = activeNode + 1;
    } else if (activeView === 'results') {
      currentStep = 6; // all done
    }
    if (stepNum < currentStep) return 'step done';
    if (stepNum === currentStep) return 'step active';
    return 'step';
  };
  const getConnClass = (connNum: number) => {
    let currentStep = 1;
    if (activeView === 'processing') currentStep = activeNode + 1;
    else if (activeView === 'results') currentStep = 6;
    
    if (connNum < currentStep) return 'connector flowing';
    return 'connector';
  };
  const getConnWidth = (connNum: number) => {
    let currentStep = 1;
    if (activeView === 'processing') currentStep = activeNode + 1;
    else if (activeView === 'results') currentStep = 6;
    
    if (connNum < currentStep) return '100%';
    return '0%';
  };
  
  const confColor = (c: number) => {
    if (c >= 0.85) return 'var(--green)';
    if (c >= 0.7) return 'var(--amber)';
    return 'var(--red)';
  };

  return (
    <>
      <div className="bg-grid"></div>
      <div className="glow-blob b1"></div>
      <div className="glow-blob b2"></div>
      <div className="glow-blob b3"></div>
      <div className="grain"></div>
      <div className="cursor-glow" ref={cursorRef}></div>

      <div className="wrap">
        <header className="topbar">
          <div className="brand">
            <div className="mark">IM</div>
            <div>
              <h1>ISO ⟶ MTO</h1>
              <p>Isometric Drawing → Automated Material Take-Off</p>
            </div>
          </div>
          <div className="status-pill"><span className="status-dot"></span> Vision Pipeline · Ready</div>
        </header>

        {/* HERO */}
        <section className="hero">
          <div>
            <div className="eyebrow"><span className="dot"></span> GEMINI 2.5 FLASH · VISION AI PIPELINE</div>
            <h1>Every elbow, flange and<br/><span className="accent">counted automatically.</span></h1>
            <p className="sub">Upload one piping isometric. Watch the pipeline trace the route, read the title block, extract every fitting, and hand back a validated, exportable Material Take-Off — no manual counting required.</p>
            <div className="hero-cta">
              <button className="btn btn-primary" onClick={() => document.getElementById('app')?.scrollIntoView({behavior:'smooth'})}>Start extracting ↓</button>
              <button className="btn btn-ghost" onClick={() => {
                document.getElementById('app')?.scrollIntoView({behavior:'smooth'});
                setTimeout(() => runDemoPipeline(), 500);
              }}>▶ Try live demo</button>
            </div>
            <div className="stat-strip">
              <div className="stat"><b>9</b><span>Component families</span></div>
              <div className="stat"><b>~15s</b><span>Avg. extraction time</span></div>
              <div className="stat"><b>Schema</b><span>Validated output</span></div>
            </div>
          </div>
          <div className="hero-art">
            <svg viewBox="0 0 420 380" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#4fb8d6"/>
                  <stop offset="1" stopColor="#7d7ad1"/>
                </linearGradient>
              </defs>
              <polyline points="40,320 40,240 120,190 120,130 200,80 300,80 300,140 380,170" fill="none" stroke="url(#heroGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
              <polyline className="flow-dash" points="40,320 40,240 120,190 120,130 200,80 300,80 300,140 380,170" fill="none" stroke="#8fd6ec" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle className="pulse-node" cx="40" cy="320" r="5" fill="#4fb8d6"/>
              <circle className="pulse-node" cx="120" cy="190" r="5" fill="#4fb8d6" style={{animationDelay:".4s"}}/>
              <circle className="pulse-node" cx="200" cy="80" r="5" fill="#7d7ad1" style={{animationDelay:".8s"}}/>
              <circle className="pulse-node" cx="300" cy="80" r="5" fill="#7d7ad1" style={{animationDelay:"1.2s"}}/>
              <g transform="translate(300,140)" opacity="0.9">
                <polygon points="-9,-7 -9,7 9,0" fill="#d97a94"/>
                <polygon points="9,-7 9,7 -9,0" fill="#d97a94"/>
              </g>
              <text x="46" y="345" fill="#57657c" fontFamily="JetBrains Mono, monospace" fontSize="10">6"-P-1501-A1A-IH</text>
              <text x="330" y="200" fill="#57657c" fontFamily="JetBrains Mono, monospace" fontSize="10">N ↑</text>
            </svg>
          </div>
        </section>

        <div className="kicker">THE PIPELINE</div>

        {/* STEPPER */}
        <div className="glass stepper" id="stepper">
          <div className={getStepClass(1)} data-step="1"><div className="node">01</div><div className="label">Upload</div></div>
          <div className={getConnClass(1)}><div className="fill" style={{width: getConnWidth(1)}}></div></div>
          <div className={getStepClass(2)} data-step="2"><div className="node">02</div><div className="label">Preprocess</div></div>
          <div className={getConnClass(2)}><div className="fill" style={{width: getConnWidth(2)}}></div></div>
          <div className={getStepClass(3)} data-step="3"><div className="node">03</div><div className="label">Vision AI</div></div>
          <div className={getConnClass(3)}><div className="fill" style={{width: getConnWidth(3)}}></div></div>
          <div className={getStepClass(4)} data-step="4"><div className="node">04</div><div className="label">Validate</div></div>
          <div className={getConnClass(4)}><div className="fill" style={{width: getConnWidth(4)}}></div></div>
          <div className={getStepClass(5)} data-step="5"><div className="node">05</div><div className="label">MTO Ready</div></div>
        </div>

        <div id="app">
          {/* UPLOAD VIEW */}
          <section className={`view ${activeView === 'upload' ? 'active' : ''}`} id="view-upload">
            <div className="glass upload-card">
              <h2>Upload an isometric drawing</h2>
              <p className="sub">PNG, JPG or PDF · one drawing per run · max 20 MB</p>

              <div 
                className={`dropzone ${isDragOver ? 'dragover' : ''}`} 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
                }}
              >
                <div className="dz-icon">📐</div>
                <h3>Drag & drop your drawing here</h3>
                <p>or click to browse files</p>
                <input type="file" ref={fileInputRef} accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => {
                  if (e.target.files?.length) handleFile(e.target.files[0]);
                }} />
              </div>

              <div className={`error-banner ${errorMsg ? 'show' : ''}`}>⚠ <span>{errorMsg}</span></div>

              <div className="upload-meta">
                <span>ACCEPTED: PNG · JPG · PDF</span>
                <span>MAX SIZE: 20MB</span>
                <span>SCOPE: 1 ISOMETRIC / RUN</span>
              </div>

              <div className="btn-row">
                <button className="btn btn-ghost" onClick={runDemoPipeline}>▶ Try a sample isometric</button>
              </div>
            </div>
          </section>

          {/* PROCESSING VIEW */}
          <section className={`view ${activeView === 'processing' ? 'active' : ''}`} id="view-processing">
            <div className="proc-grid">
              <div className="glass pipeline-card">
                <h3>Pipeline</h3>
                <div className="pipe-node-row">
                  <div className={`pipe-node ${activeNode===1?'active':activeNode>1?'done':''}`}>
                    <div className="dot">↥</div><div className="info"><h4>Normalize input</h4><p>render / resize / enhance</p></div>
                  </div>
                  <div className={`pipe-node ${activeNode===2?'active':activeNode>2?'done':''}`}>
                    <div className="dot">◈</div><div className="info"><h4>Vision AI extraction</h4><p>gemini-2.5-flash · structured JSON</p></div>
                  </div>
                  <div className={`pipe-node ${activeNode===3?'active':activeNode>3?'done':''}`}>
                    <div className="dot">✓</div><div className="info"><h4>Schema validation</h4><p>pydantic · unit normalization</p></div>
                  </div>
                  <div className={`pipe-node ${activeNode===4?'active':activeNode>4?'done':''}`}>
                    <div className="dot">Σ</div><div className="info"><h4>Derive & total</h4><p>gaskets · bolt sets · summary</p></div>
                  </div>
                </div>
                <div className="progress-outer"><div className="progress-inner" style={{width: progressPct + '%'}}></div></div>
                <div className="progress-label"><span>{progressStatus}</span><span>{progressPct}%</span></div>
              </div>

              <div className="glass log-card">
                <h3>Live log</h3>
                <div className="log-terminal" ref={logTerminalRef}>
                  {logs.map((l, idx) => (
                    <div key={idx} className="l-line">
                      <span className={l.tag === 'ok' ? 'tag-ok' : l.tag === 'warn' ? 'tag-warn' : 'tag-info'}>
                        {l.tag === 'ok' ? 'OK' : l.tag === 'warn' ? '!!' : '..'}
                      </span> {l.msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* RESULTS VIEW */}
          <section className={`view ${activeView === 'results' ? 'active' : ''}`} id="view-results">
            {mtoData && (
              <>
                <div className="meta-row">
                  <div className="glass meta-chip"><div className="k">Drawing No.</div><div className="v">{mtoData.drawing_meta.drawing_no}</div></div>
                  <div className="glass meta-chip"><div className="k">Revision</div><div className="v">{mtoData.drawing_meta.revision}</div></div>
                  <div className="glass meta-chip"><div className="k">Line Number</div><div className="v">{mtoData.drawing_meta.line_number}</div></div>
                  <div className="glass meta-chip"><div className="k">NPS</div><div className="v">{mtoData.drawing_meta.nps}</div></div>
                  <div className="glass meta-chip"><div className="k">Material Class</div><div className="v">{mtoData.drawing_meta.material_class}</div></div>
                  <div className="glass meta-chip"><div className="k">Service</div><div className="v">{mtoData.drawing_meta.service}</div></div>
                </div>
                <div className="summary-row">
                  <div className="glass sum-chip"><div className="num">{typeof mtoData.summary.total_pipe_length_m === 'number' ? mtoData.summary.total_pipe_length_m.toFixed(2) : mtoData.summary.total_pipe_length_m} m</div><div className="lbl">Total pipe length</div></div>
                  <div className="glass sum-chip"><div className="num">{mtoData.summary.fittings}</div><div className="lbl">Fittings</div></div>
                  <div className="glass sum-chip"><div className="num">{mtoData.summary.flanges}</div><div className="lbl">Flanges</div></div>
                  <div className="glass sum-chip"><div className="num">{mtoData.summary.valves}</div><div className="lbl">Valves</div></div>
                  <div className="glass sum-chip"><div className="num">{mtoData.summary.gaskets}</div><div className="lbl">Gaskets</div></div>
                  <div className="glass sum-chip"><div className="num">{mtoData.summary.bolt_sets}</div><div className="lbl">Bolt sets</div></div>
                  <div className="glass sum-chip"><div className="num">{mtoData.summary.field_welds}</div><div className="lbl">Field welds</div></div>
                </div>

                <div className="main-grid">
                  <div className="glass preview-card">
                    <h3>Source drawing <span style={{display:'flex', gap:'8px', alignItems:'center'}}><button className={`toggle-btn ${showDetections ? 'on':''}`} disabled={!isDemo} onClick={() => setShowDetections(!showDetections)}>◎ Show AI detections</button>{isDemo && <span className="badge-mock">DEMO INPUT</span>}</span></h3>
                    <div className="preview-frame" style={{cursor: isDemo ? 'default' : 'zoom-in'}} onClick={() => !isDemo && setIsZoomed(true)}>
                      {isDemo ? (
                        <div dangerouslySetInnerHTML={{__html: SAMPLE_SVG.replace('<g class="det-layer" id="detLayer">', `<g class="det-layer ${showDetections?'show':''}">`)}} />
                      ) : (
                        uploadedImageUrl && (
                          uploadedFileType === 'application/pdf' ? (
                            <div style={{position: 'relative', width: '100%', height: '100%'}}>
                              <embed src={uploadedImageUrl} type="application/pdf" width="100%" height="100%" style={{minHeight: '400px'}} />
                              <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10}}></div>
                            </div>
                          ) : (
                            <img src={uploadedImageUrl} alt="Uploaded drawing" />
                          )
                        )
                      )}
                    </div>
                  </div>

                  <div className="glass table-card">
                    <h3>Material Take-Off <span className="badge-mock" style={{display: isDemo ? 'inline-block' : 'none'}}>MOCK PIPELINE</span></h3>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>#</th><th>Category</th><th>Description</th><th>Size</th><th>Sched/Class</th>
                            <th>Material</th><th>End</th><th>Qty</th><th>Unit</th><th>Length (m)</th><th>Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mtoData.items.map((item, idx) => (
                            <tr key={idx} style={{animationDelay: `${idx * 0.05}s`}}>
                              <td>{item.item_no}</td>
                              <td><span className={`cat-pill cat-${item.category}`}>{item.category}</span></td>
                              <td>{item.description}</td>
                              <td>{item.size_nps}</td>
                              <td>{item.schedule_rating}</td>
                              <td>{item.material_spec}</td>
                              <td>{item.end_type}</td>
                              <td>{item.quantity}</td>
                              <td>{item.unit}</td>
                              <td>{item.length_m || '-'}</td>
                              <td>
                                <div className="conf-wrap">
                                  <span>{Math.round(item.confidence * 100)}%</span>
                                  <div className="conf-bar"><i style={{width: `${item.confidence * 100}%`, background: confColor(item.confidence)}}></i></div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="actions-row">
                      <button className="btn btn-ghost" onClick={() => { setActiveView('upload'); setMtoData(null); setJobId(null); setIsDemo(false); }}>↺ Upload another drawing</button>
                      <div style={{display:'flex', gap:'12px'}}>
                        <button className="btn btn-primary" style={{background: '#1d6f42', borderColor: '#1d6f42'}} onClick={handleDownloadExcel}>⇩ Export Excel</button>
                        <button className="btn btn-primary" onClick={handleDownloadCsv}>⇩ Export CSV</button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        <footer>ISO ⟶ MTO · full-stack AI assessment · Frontend flow running on React/Next.js and FastAPI</footer>
      </div>

      <div className={`toast glass ${toastMsg ? 'show' : ''}`}><span className="tick">✓</span><span>{toastMsg}</span></div>

      {isZoomed && uploadedImageUrl && (
        <div className="zoom-modal" onClick={() => setIsZoomed(false)}>
          <div className="zoom-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsZoomed(false)}>✕</button>
            {uploadedFileType === 'application/pdf' ? (
              <embed src={uploadedImageUrl} type="application/pdf" width="100%" height="100%" />
            ) : (
              <img src={uploadedImageUrl} alt="Zoomed drawing" />
            )}
          </div>
        </div>
      )}
    </>
  );
}
