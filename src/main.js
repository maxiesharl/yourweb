import "./style.css";
//import { Network, DataSet } from "vis-network/standalone";
import vis from "vis";
const { Network, DataSet } = vis;
import timeline from "./data/timeline.json";   // Vite 原生支持 JSON 导入

const COLORS = {
  year:   { background: "#4e79a7", border: "#2c4f75" },
  race:   { background: "#e15759", border: "#a83234" },
  "卡丁车": { background: "#76b7b2", border: "#4a8b87" },
  "青训":  { background: "#59a14f", border: "#3a7a32" },
  "F1":   { background: "#f28e2b", border: "#b5651a" },
  "赛季":  { background: "#b07aa1", border: "#7a4f6e" },
  "言论":  { background: "#edc948", border: "#b59a2b" },
  "车手游行":  { bbackground: "#9c9c9c", border: "#6e6e6e"  },
  "记者会":  { bbackground: "#9c9c9c", border: "#6e6e6e"  },
  //event:  { background: "#9c9c9c", border: "#6e6e6e" },
};

let network;

function buildGraph(rows) {
  const nodes = new Map();
  const edges = new Map();

  const addNode = (id, label, group, extra = {}) => {
    if (!nodes.has(id)) {
      nodes.set(id, {
        id, label, group,
        color: COLORS[group] || COLORS.event,
        font: { size: 14 },
        ...extra,
      });
    }
  };
  const addEdge = (from, to, label) => {
    const key = `${from}->${to}`;
    if (!edges.has(key)) {
      edges.set(key, {
        id: key, from, to, label,
        arrows: "to",
        color: { color: "#bbb" },
        font: { size: 10, align: "middle" },
      });
    }
  };

  rows.forEach(r => {
    const yid = `Y${r.year}`;
    const eid = `E_${r.year}_${r.event_title}`;
    addNode(yid, String(r.year), "year");
    addNode(eid, r.event_title, r.tag || "event", {
      title: r.event_desc || "",
      url: r.source_url || "",
    });
    addEdge(yid, eid, "HAS");

    if (r.race_name) {
      const rid = `R_${r.race_name}`;
      addNode(rid, r.race_name, "race", {
        title: r.race_date || "",
        url: r.source_url || "",
      });
      addEdge(eid, rid, "AT");
    }
  });

  return {
    nodes: new DataSet([...nodes.values()]),
    edges: new DataSet([...edges.values()]),
  };
}

function render(rows) {
  const { nodes, edges } = buildGraph(rows);
  const container = document.getElementById("net");
  if (network) network.destroy();

  network = new Network(container, { nodes, edges }, {
    physics: {
      stabilization: true,
      barnesHut: { gravitationalConstant: -8000, springLength: 120 },
    },
    interaction: { hover: true, tooltipDelay: 200, navigationButtons: true },
    nodes: { shape: "dot", size: 18, borderWidth: 2 },
    edges: { smooth: { type: "continuous" } },
  });

  network.on("click", params => {
    const msg = document.getElementById("msg");
    if (params.nodes.length === 0) { msg.textContent = ""; return; }
    const node = nodes.get(params.nodes[0]);
    msg.innerHTML = node.url
      ? `来源：<a href="${node.url}" target="_blank" rel="noopener">打开</a>`
      : "";
  });
}

function applyFilter(tag = "") {
  const rows = tag ? timeline.filter(r => r.tag === tag) : timeline;
  render(rows);
}

document.getElementById("tag").addEventListener("change", e => applyFilter(e.target.value));
applyFilter();