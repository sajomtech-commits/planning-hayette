const PlanningApp = (() => {
  const STORAGE_KEY = 'planning_hayette_donnees';
  const STATUTS = ['travaille', 'repos', 'congé', 'formation', 'autre'];
  const JOURS_SEMAINE = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const JOURS_COMPLETS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  let donnees = [];
  let vueActuelle = 'aujourdhui';
  let dateCourante = new Date();

  function aujourdhui() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formaterDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const j = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${j}`;
  }

  function formaterDateLisible(d) {
    return `${d.getDate()} ${MOIS_NOMS[d.getMonth()]} ${d.getFullYear()}`;
  }

  function estMemeJour(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }

  function trouverJour(dateStr) {
    return donnees.find(j => j.date === dateStr);
  }

  function obtenirDateDepuisString(s) {
    const [y, m, j] = s.split('-').map(Number);
    return new Date(y, m - 1, j);
  }

  function chargerDonnees() {
    const stockees = localStorage.getItem(STORAGE_KEY);
    if (stockees) {
      try {
        donnees = JSON.parse(stockees);
        return Promise.resolve();
      } catch (e) {
        console.warn('Erreur lecture localStorage, chargement fichier JSON');
      }
    }
    return fetch('data/planning.json')
      .then(r => {
        if (!r.ok) throw new Error('Fichier planning.json introuvable');
        return r.json();
      })
      .then(d => {
        donnees = d;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(donnees));
      })
      .catch(() => {
        donnees = [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(donnees));
      });
  }

  function sauvegarderDonnees() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(donnees));
  }

  function mettreJour(dateStr, infos) {
    const idx = donnees.findIndex(j => j.date === dateStr);
    if (idx >= 0) {
      donnees[idx] = { ...donnees[idx], ...infos };
    } else {
      donnees.push({
        date: dateStr,
        status: 'repos',
        start: '',
        end: '',
        note: '',
        ...infos
      });
    }
    sauvegarderDonnees();
    renduComplet();
    montrerNotification('Planning mis à jour');
  }

  function creerJour(dateStr) {
    if (!trouverJour(dateStr)) {
      donnees.push({ date: dateStr, status: 'repos', start: '', end: '', note: '' });
      donnees.sort((a, b) => a.date.localeCompare(b.date));
      sauvegarderDonnees();
    }
  }

  function prochainJourTravaille() {
    const aujourd = formaterDate(aujourdhui());
    return donnees
      .filter(j => j.status === 'travaille' && j.date > aujourd)
      .sort((a, b) => a.date.localeCompare(b.date))[0] || null;
  }

  function dernierJourTravaille() {
    const aujourd = formaterDate(aujourdhui());
    return donnees
      .filter(j => j.status === 'travaille' && j.date < aujourd)
      .sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  }

  function statutBadgeClass(status) {
    const map = {
      'travaille': 'badge-travaille',
      'repos': 'badge-repos',
      'congé': 'badge-conge',
      'formation': 'badge-formation',
      'autre': 'badge-autre'
    };
    return map[status] || 'badge-repos';
  }

  function statutClasseCalendrier(status) {
    return `statut-${status}`;
  }

  function couleurStatut(status) {
    const map = {
      'travaille': '#4CAF50',
      'repos': '#9E9E9E',
      'congé': '#9C27B0',
      'formation': '#FF9800',
      'autre': '#E91E63'
    };
    return map[status] || '#9E9E9E';
  }

  function iconeStatut(status) {
    const map = {
      'travaille': '💼',
      'repos': '🏠',
      'congé': '🏖️',
      'formation': '📚',
      'autre': '📌'
    };
    return map[status] || '❓';
  }

  function renduNavigation() {
    const navBar = document.getElementById('nav-bar');
    const vues = [
      { id: 'aujourdhui', label: 'Aujourd\'hui', icone: '📅' },
      { id: 'semaine', label: 'Semaine', icone: '📆' },
      { id: 'mois', label: 'Mois', icone: '🗓️' },
      { id: 'annee', label: 'Année', icone: '📋' },
      { id: 'edition', label: 'Modifier', icone: '✏️' }
    ];

    navBar.innerHTML = vues.map(v => `
      <button class="nav-btn ${vueActuelle === v.id ? 'actif' : ''}" data-vue="${v.id}">
        <span class="icone-nav">${v.icone}</span>
        ${v.label}
      </button>
    `).join('');

    navBar.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        changerVue(btn.dataset.vue);
      });
    });
  }

  function changerVue(vue) {
    vueActuelle = vue;
    renduNavigation();
    document.querySelectorAll('.vue').forEach(el => el.classList.remove('active'));
    const el = document.getElementById(`vue-${vue}`);
    if (el) el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (vue === 'aujourdhui') renduAujourdhui();
    else if (vue === 'semaine') renduSemaine();
    else if (vue === 'mois') renduMois();
    else if (vue === 'annee') renduAnnee();
    else if (vue === 'edition') renduEdition();
  }

  function renduAujourdhui() {
    const conteneur = document.getElementById('vue-aujourdhui');
    const ajd = aujourdhui();
    const ajdStr = formaterDate(ajd);
    const jour = trouverJour(ajdStr) || { date: ajdStr, status: 'repos', start: '', end: '', note: '' };
    const prochain = prochainJourTravaille();

    conteneur.innerHTML = `
      <div class="carte carte-aujourdhui">
        <div class="titre-carte">Aujourd'hui</div>
        <div class="aujourdhui-date">${JOURS_COMPLETS[ajd.getDay()]} ${formaterDateLisible(ajd)}</div>
        <div class="aujourdhui-statut">
          <span class="badge ${statutBadgeClass(jour.status)}">
            ${iconeStatut(jour.status)} ${jour.status.charAt(0).toUpperCase() + jour.status.slice(1)}
          </span>
        </div>
        ${jour.status === 'travaille' && jour.start && jour.end ? `
          <div class="aujourdhui-horaire">${jour.start} — ${jour.end}</div>
        ` : jour.status === 'travaille' ? `
          <div class="aujourdhui-horaire">Horaires non renseignés</div>
        ` : ''}
        ${jour.note ? `<div class="aujourdhui-note">📝 ${jour.note}</div>` : ''}
      </div>

      <div class="carte">
        <div class="titre-carte">Prochain jour travaillé</div>
        ${prochain ? (() => {
          const d = obtenirDateDepuisString(prochain.date);
          return `
            <div class="prochain-info">
              <div>
                <div class="prochain-jour">${JOURS_COMPLETS[d.getDay()]} ${d.getDate()} ${MOIS_NOMS[d.getMonth()]}</div>
                <div class="prochain-date">${prochain.start ? `${prochain.start} — ${prochain.end}` : 'Horaires à définir'}</div>
              </div>
              <span class="badge ${statutBadgeClass(prochain.status)}">${iconeStatut(prochain.status)} Travaillé</span>
            </div>
          `;
        })() : '<div class="vide-message">Aucun prochain jour travaillé trouvé</div>'}
      </div>

      <div class="carte">
        <div class="titre-carte">Aperçu des prochains jours</div>
        ${renduApercuProchainsJours(7)}
      </div>
    `;
  }

  function renduApercuProchainsJours(nbJours) {
    const ajd = aujourdhui();
    const jours = [];

    for (let i = 0; i < nbJours; i++) {
      const d = new Date(ajd);
      d.setDate(d.getDate() + i);
      const str = formaterDate(d);
      const jour = trouverJour(str);
      jours.push({ date: d, dateStr: str, donnee: jour || { status: 'repos', start: '', end: '' } });
    }

    return jours.map(j => {
      const estAjd = i => estMemeJour(j.date, ajd);
      const classes = `ligne-jour ${j.donnee.status === 'travaille' ? statutClasseCalendrier(j.donnee.status) : ''}`;
      return `
        <div class="${classes}" onclick="PlanningApp.ouvrirEditionJour('${j.dateStr}')">
          <div class="lj-date">
            ${estAjd(j.date) ? 'Aujourd\'hui' : JOURS_SEMAINE[j.date.getDay()]}
            <br><small>${j.date.getDate()} ${MOIS_NOMS[j.date.getMonth()].slice(0, 3)}</small>
          </div>
          <div class="lj-statut">
            <span class="badge ${statutBadgeClass(j.donnee.status)}">${iconeStatut(j.donnee.status)} ${j.donnee.status}</span>
          </div>
          <div class="lj-horaire">
            ${j.donnee.start ? `${j.donnee.start}${j.donnee.end ? '-' + j.donnee.end : ''}` : '—'}
          </div>
        </div>
      `;
    }).join('');
  }

  function renduSemaine() {
    const conteneur = document.getElementById('vue-semaine');
    const ajd = aujourdhui();
    const debutSemaine = new Date(ajd);
    const jourSem = ajd.getDay();
    const diffLun = jourSem === 0 ? -6 : 1 - jourSem;
    debutSemaine.setDate(ajd.getDate() + diffLun);

    conteneur.innerHTML = `
      <div class="carte">
        <div class="semaine-header">
          <button class="btn-nav-periode" data-action="semaine-prev">◀</button>
          <div class="semaine-titre" id="semaine-titre"></div>
          <button class="btn-nav-periode" data-action="semaine-next">▶</button>
        </div>
        <div class="legende">
          ${Object.entries({
            'travaille': '#4CAF50', 'repos': '#9E9E9E', 'congé': '#9C27B0',
            'formation': '#FF9800', 'autre': '#E91E63'
          }).map(([k, v]) => `
            <div class="legende-item">
              <span class="legende-point" style="background:${v}"></span>
              ${k.charAt(0).toUpperCase() + k.slice(1)}
            </div>
          `).join('')}
        </div>
        <div id="semaine-grille"></div>
      </div>
    `;

    const dateCle = new Date(debutSemaine);
    window._semaineDebut = debutSemaine;

    conteneur.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = btn.dataset.action === 'semaine-prev' ? -7 : 7;
        window._semaineDebut.setDate(window._semaineDebut.getDate() + delta);
        renduGrilleSemaine(window._semaineDebut);
      });
    });

    renduGrilleSemaine(debutSemaine);
  }

  function renduGrilleSemaine(debut) {
    const titre = document.getElementById('semaine-titre');
    const grille = document.getElementById('semaine-grille');
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 6);

    const ajd = aujourdhui();
    titre.textContent = `${debut.getDate()} ${MOIS_NOMS[debut.getMonth()]} — ${fin.getDate()} ${MOIS_NOMS[fin.getDate()]} ${fin.getFullYear()}`;

    let html = '<div class="jour-semaine">';
    for (let i = 0; i < 7; i++) {
      html += `<div class="en-tete">${JOURS_SEMAINE[i]}</div>`;
    }
    html += '</div><div class="jour-semaine">';

    for (let i = 0; i < 7; i++) {
      const d = new Date(debut);
      d.setDate(debut.getDate() + i);
      const str = formaterDate(d);
      const jour = trouverJour(str) || { status: 'repos', start: '', end: '' };
      const estAjd = estMemeJour(d, ajd);
      const couleur = couleurStatut(jour.status);

      html += `
        <div class="carte-jour-semaine ${statutClasseCalendrier(jour.status)} ${estAjd ? 'est-aujourdhui' : ''}"
             style="background:${couleur}15" onclick="PlanningApp.ouvrirEditionJour('${str}')">
          <div class="num-jour">${d.getDate()}</div>
          ${jour.status === 'travaille' && jour.start && jour.end
            ? `<div class="mini-horaire">${jour.start}<br>${jour.end}</div>`
            : `<div class="mini-horaire" style="font-size:0.7rem">${jour.status}</div>`}
          <span class="point" style="background:${couleur};width:6px;height:6px;border-radius:50%;display:inline-block"></span>
        </div>
      `;
    }

    html += '</div>';
    grille.innerHTML = html;
  }

  function renduMois(annee, mois) {
    const ajd = aujourdhui();
    const a = annee !== undefined ? annee : ajd.getFullYear();
    const m = mois !== undefined ? mois : ajd.getMonth();

    if (!window._moisCourant) window._moisCourant = { annee: a, mois: m };
    window._moisCourant = { annee: a, mois: m };

    const conteneur = document.getElementById('vue-mois');
    const premierJour = new Date(a, m, 1);
    const dernierJour = new Date(a, m + 1, 0);
    const debutCal = premierJour.getDay();

    conteneur.innerHTML = `
      <div class="carte">
        <div class="mois-header">
          <button class="btn-nav-periode" data-action="mois-prev">◀</button>
          <div class="mois-titre">${MOIS_NOMS[m]} ${a}</div>
          <button class="btn-nav-periode" data-action="mois-next">▶</button>
        </div>
        <div class="legende">
          ${Object.entries({
            'travaille': '#4CAF50', 'repos': '#9E9E9E', 'congé': '#9C27B0',
            'formation': '#FF9800', 'autre': '#E91E63'
          }).map(([k, v]) => `
            <div class="legende-item">
              <span class="legende-point" style="background:${v}"></span>
              ${k.charAt(0).toUpperCase() + k.slice(1)}
            </div>
          `).join('')}
        </div>
        <div id="mois-grille"></div>
        <div id="mois-liste" style="margin-top:16px"></div>
      </div>
    `;

    conteneur.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = btn.dataset.action === 'mois-prev' ? -1 : 1;
        let nouveauMois = window._moisCourant.mois + delta;
        let nouvelleAnnee = window._moisCourant.annee;
        if (nouveauMois < 0) { nouveauMois = 11; nouvelleAnnee--; }
        if (nouveauMois > 11) { nouveauMois = 0; nouvelleAnnee++; }
        renduMois(nouvelleAnnee, nouveauMois);
      });
    });

    let grilleHtml = '<div class="calendrier">';
    for (let i = 0; i < 7; i++) {
      grilleHtml += `<div class="en-tete">${JOURS_SEMAINE[i]}</div>`;
    }

    for (let i = 0; i < debutCal; i++) {
      grilleHtml += '<div class="case-jour hors-mois"></div>';
    }

    for (let j = 1; j <= dernierJour.getDate(); j++) {
      const d = new Date(a, m, j);
      const str = formaterDate(d);
      const jour = trouverJour(str);
      const status = jour ? jour.status : 'repos';
      const estAjd = estMemeJour(d, ajd);

      grilleHtml += `
        <div class="case-jour ${statutClasseCalendrier(status)} ${estAjd ? 'est-aujourdhui' : ''}"
             onclick="PlanningApp.ouvrirEditionJour('${str}')">
          <span class="num">${j}</span>
          ${status !== 'repos' ? `<span class="point"></span>` : ''}
        </div>
      `;
    }

    grilleHtml += '</div>';
    document.getElementById('mois-grille').innerHTML = grilleHtml;

    const joursMois = donnees
      .filter(j => j.date.startsWith(`${a}-${String(m + 1).padStart(2, '0')}`))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (joursMois.length > 0) {
      const travail = joursMois.filter(j => j.status === 'travaille').length;
      const repos = joursMois.filter(j => j.status === 'repos').length;
      const conge = joursMois.filter(j => j.status === 'congé').length;
      const formation = joursMois.filter(j => j.status === 'formation').length;
      const autre = joursMois.filter(j => j.status === 'autre').length;

      let listeHtml = `
        <div class="titre-carte">Récapitulatif du mois</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px">
          <span style="font-size:0.85rem">💼 Travaillé: <strong>${travaille}</strong></span>
          <span style="font-size:0.85rem">🏠 Repos: <strong>${repos}</strong></span>
          <span style="font-size:0.85rem">🏖️ Congé: <strong>${conge}</strong></span>
          <span style="font-size:0.85rem">📚 Formation: <strong>${formation}</strong></span>
          <span style="font-size:0.85rem">📌 Autre: <strong>${autre}</strong></span>
        </div>
      `;

      listeHtml += '<div class="liste-jours">';
      joursMois.sort((a, b) => a.date.localeCompare(b.date));
      joursMois.forEach(j => {
        const d = obtenirDateDepuisString(j.date);
        listeHtml += `
          <div class="ligne-jour" onclick="PlanningApp.ouvrirEditionJour('${j.date}')">
            <div class="lj-date">${JOURS_SEMAINE[d.getDay()]} ${d.getDate()}</div>
            <div class="lj-statut">
              <span class="badge ${statutBadgeClass(j.status)}">${iconeStatut(j.status)} ${j.status}</span>
            </div>
            <div class="lj-horaire">${j.start ? `${j.start}${j.end ? '-' + j.end : ''}` : '—'}</div>
          </div>
        `;
      });
      listeHtml += '</div>';
      document.getElementById('mois-liste').innerHTML = listeHtml;
    } else {
      document.getElementById('mois-liste').innerHTML = '<div class="vide-message">Aucune donnée pour ce mois</div>';
    }
  }

  function renduAnnee() {
    const ajd = aujourdhui();
    const annee = ajd.getFullYear();

    if (!window._anneeCourante) window._anneeCourante = annee;
    window._anneeCourante = annee;

    const conteneur = document.getElementById('vue-annee');
    conteneur.innerHTML = `
      <div class="carte">
        <div class="annee-header">
          <button class="btn-nav-periode" data-action="annee-prev">◀</button>
          <div class="annee-titre" id="annee-titre">${annee}</div>
          <button class="btn-nav-periode" data-action="annee-next">▶</button>
        </div>
        <div id="annee-grille" class="grille-annee"></div>
      </div>
    `;

    conteneur.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = btn.dataset.action === 'annee-prev' ? -1 : 1;
        window._anneeCourante += delta;
        renduGrilleAnnee(window._anneeCourante);
      });
    });

    renduGrilleAnnee(annee);
  }

  function renduGrilleAnnee(annee) {
    document.getElementById('annee-titre').textContent = annee;

    const grille = document.getElementById('annee-grille');
    grille.innerHTML = '';

    for (let m = 0; m < 12; m++) {
      const moisStr = String(m + 1).padStart(2, '0');
      const joursMois = donnees.filter(j => j.date.startsWith(`${annee}-${moisStr}`));
      const total = joursMois.length;
      const travail = joursMois.filter(j => j.status === 'travaille').length;
      const repos = joursMois.filter(j => j.status === 'repos').length;

      const carte = document.createElement('div');
      carte.className = 'carte-mois';
      carte.onclick = () => {
        window._moisCourant = { annee, mois: m };
        changerVue('mois');
        renduMois(annee, m);
      };

      const travailPct = total > 0 ? (travail / total) * 100 : 0;
      const reposPct = total > 0 ? (repos / total) * 100 : 0;
      const autrePct = total > 0 ? ((total - travail - repos) / total) * 100 : 0;

      carte.innerHTML = `
        <div class="mois-nom">${MOIS_NOMS[m]}</div>
        <div class="stats-mois">
          📅 ${total} jours renseignés<br>
          💼 ${travail} jours travaillés
        </div>
        ${total > 0 ? `
          <div class="barre-stats">
            <div class="barre-section" style="width:${travailPct}%;background:#4CAF50"></div>
            <div class="barre-section" style="width:${reposPct}%;background:#9E9E9E"></div>
            <div class="barre-section" style="width:${autrePct}%;background:#9C27B0"></div>
          </div>
        ` : ''}
      `;

      grille.appendChild(carte);
    }
  }

  function renduEdition() {
    const conteneur = document.getElementById('vue-edition');

    const ajd = aujourdhui();
    const ajdStr = formaterDate(ajd);
    const jour = trouverJour(ajdStr) || { date: ajdStr, status: 'repos', start: '', end: '', note: '' };

    conteneur.innerHTML = `
      <div class="carte">
        <div class="titre-carte">Modifier une journée</div>
        <form id="form-edition" class="form-edition">
          <div class="groupe-champ">
            <label for="edit-date">Date</label>
            <input type="date" id="edit-date" value="${ajdStr}" required>
          </div>
          <div class="groupe-champ">
            <label for="edit-status">Statut</label>
            <select id="edit-status">
              ${STATUTS.map(s => `
                <option value="${s}" ${jour.status === s ? 'selected' : ''}>
                  ${s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="groupe-champ">
            <label for="edit-start">Début</label>
            <input type="time" id="edit-start" value="${jour.start}">
          </div>
          <div class="groupe-champ">
            <label for="edit-end">Fin</label>
            <input type="time" id="edit-end" value="${jour.end}">
          </div>
          <div class="groupe-champ">
            <label for="edit-note">Note</label>
            <textarea id="edit-note" rows="2">${jour.note}</textarea>
          </div>
          <div class="groupe-boutons">
            <button type="submit" class="btn btn-primaire">Enregistrer</button>
            <button type="button" class="btn btn-secondaire" id="btn-effacer">Effacer ce jour</button>
          </div>
        </form>
      </div>

      <div class="carte">
        <div class="titre-carte">Raccourcis rapides</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">
          <button class="btn btn-primaire" data-rapide="travaille">💼 Travaillé</button>
          <button class="btn btn-secondaire" data-rapide="repos">🏠 Repos</button>
          <button class="btn" style="background:var(--statut-conge-fond);color:var(--statut-conge);font-weight:600" data-rapide="congé">🏖️ Congé</button>
          <button class="btn" style="background:var(--statut-formation-fond);color:var(--statut-formation);font-weight:600" data-rapide="formation">📚 Formation</button>
        </div>
      </div>

      <div class="carte section-import-export">
        <div class="titre-carte">Exporter / Importer</div>
        <p style="font-size:0.85rem;color:var(--couleur-texte-secondaire);margin-bottom:12px">
          Exportez votre planning pour le sauvegarder, ou importez un fichier JSON.
        </p>
        <div class="groupe-boutons">
          <button class="btn btn-primaire" id="btn-exporter">📥 Exporter</button>
          <button class="btn btn-secondaire" id="btn-importer">📤 Importer</button>
          <input type="file" id="input-fichier" accept=".json" style="display:none">
          <button class="btn btn-danger" id="btn-reinitialiser">🔄 Réinitialiser</button>
        </div>
      </div>
    `;

    document.getElementById('form-edition').addEventListener('submit', (e) => {
      e.preventDefault();
      const date = document.getElementById('edit-date').value;
      const status = document.getElementById('edit-status').value;
      const start = document.getElementById('edit-start').value;
      const end = document.getElementById('edit-end').value;
      const note = document.getElementById('edit-note').value;
      mettreJour(date, { status, start, end, note });
    });

    document.getElementById('btn-effacer').addEventListener('click', () => {
      const date = document.getElementById('edit-date').value;
      mettreJour(date, { status: 'repos', start: '', end: '', note: '' });
      document.getElementById('edit-status').value = 'repos';
      document.getElementById('edit-start').value = '';
      document.getElementById('edit-end').value = '';
      document.getElementById('edit-note').value = '';
    });

    conteneur.querySelectorAll('[data-rapide]').forEach(btn => {
      btn.addEventListener('click', () => {
        const date = document.getElementById('edit-date').value;
        const status = btn.dataset.rapide;
        document.getElementById('edit-status').value = status;
        creerJour(date);
        mettreJour(date, { status });
      });
    });

    document.getElementById('btn-exporter').addEventListener('click', exporterDonnees);
    document.getElementById('btn-importer').addEventListener('click', () => {
      document.getElementById('input-fichier').click();
    });
    document.getElementById('input-fichier').addEventListener('change', importerDonnees);
    document.getElementById('btn-reinitialiser').addEventListener('click', reinitialiserDonnees);

    document.getElementById('edit-date').addEventListener('change', (e) => {
      const date = e.target.value;
      const jour = trouverJour(date);
      if (jour) {
        document.getElementById('edit-status').value = jour.status;
        document.getElementById('edit-start').value = jour.start || '';
        document.getElementById('edit-end').value = jour.end || '';
        document.getElementById('edit-note').value = jour.note || '';
      } else {
        document.getElementById('edit-status').value = 'repos';
        document.getElementById('edit-start').value = '';
        document.getElementById('edit-end').value = '';
        document.getElementById('edit-note').value = '';
      }
    });
  }

  function ouvrirEditionJour(dateStr) {
    changerVue('edition');
    setTimeout(() => {
      const champ = document.getElementById('edit-date');
      if (champ) {
        champ.value = dateStr;
        champ.dispatchEvent(new Event('change'));
      }
    }, 100);
  }

  function exporterDonnees() {
    const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planning-hayette-${formaterDate(aujourdhui())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    montrerNotification('Fichier exporté');
  }

  function importerDonnees(e) {
    const fichier = e.target.files[0];
    if (!fichier) return;
    const lecteur = new FileReader();
    lecteur.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (!Array.isArray(data)) throw new Error('Format invalide');
        donnees = data;
        sauvegarderDonnees();
        renduComplet();
        montrerNotification(`${data.length} jours importés`);
      } catch (err) {
        montrerNotification('Erreur : fichier JSON invalide');
      }
    };
    lecteur.readAsText(fichier);
    e.target.value = '';
  }

  function reinitialiserDonnees() {
    if (!confirm('Voulez-vous vraiment réinitialiser toutes les données locales ?')) return;
    localStorage.removeItem(STORAGE_KEY);
    chargerDonnees().then(() => {
      renduComplet();
      montrerNotification('Données réinitialisées');
    });
  }

  function montrerNotification(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('visible'), 2500);
  }

  function renduComplet() {
    renduNavigation();
    document.querySelectorAll('.vue').forEach(el => el.classList.remove('active'));
    const el = document.getElementById(`vue-${vueActuelle}`);
    if (el) el.classList.add('active');

    if (vueActuelle === 'aujourdhui') renduAujourdhui();
    else if (vueActuelle === 'semaine') renduSemaine();
    else if (vueActuelle === 'mois') renduMois();
    else if (vueActuelle === 'annee') renduAnnee();
    else if (vueActuelle === 'edition') renduEdition();
  }

  function initialiser() {
    chargerDonnees().then(() => {
      renduComplet();
    });
  }

  return {
    initialiser,
    ouvrirEditionJour
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  PlanningApp.initialiser();
});
