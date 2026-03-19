export const extraResources = {
  en: {
    translation: {
      profile: {
        profile: "PROFILE",
        accountSettings: "ACCOUNT SETTINGS",
        activePersona: "ACTIVE PERSONA",
        recentSessions: "RECENT SESSIONS",
        progress: "PROGRESS",
        strategiesDecks: "STRATEGIES & DECKS",
        fullSettings: "FULL SETTINGS ->",
        manage: "MANAGE ->",
        viewAll: "VIEW ALL ->",
        cardsPlayed: "CARDS PLAYED",
        cardsPlayedN: "{{count}} cards played",
        noPersonas: "No personas yet. A default will be created on your first session.",
        noSessions: "No sessions yet.",
        stage: "Stage",
        username: "USERNAME",
        emailAddress: "EMAIL ADDRESS",
        password: "PASSWORD",
        change: "CHANGE",
        save: "SAVE",
        edit: "EDIT",
        updatePassword: "UPDATE PASSWORD",
        saving: "SAVING...",
        cancel: "CANCEL",
        current: "CURRENT",
        new: "NEW",
        confirmNew: "CONFIRM NEW",
        changePassword: "CHANGE PASSWORD",
        tooShort: "Too short",
        mismatch: "Mismatch",
        passwordMinError: "Password must be at least 8 characters.",
        passwordMismatchError: "Passwords do not match.",
        success: "Success",
        passwordUpdated: "Password updated.",
        error: "Error",
        updateFailed: "Update failed.",
        atLeastOneDeck: "At least one deck must remain enabled.",
        atLeastOneStrategy: "At least one strategy must remain enabled.",
        couldNotUpdateDeck: "Could not update deck.",
        couldNotUpdateStrategy: "Could not update strategy.",
        logout: "LOG OUT",
        back: "BACK ->",
        tier: "TIER",
        role: "ROLE",
        memberSince: "MEMBER SINCE",
        status: "STATUS",
        verified: "VERIFIED",
        deckHint: "Enable or disable strategies and individual decks. Locked items unlock as you play.",
        viewTrajectory: "VIEW TRAJECTORY ->",
        unlocksAt: "Unlocks at {{count}} cards",
        locked: "LOCKED",
        required: "Required"
      },
      personas: {
        title: "PERSONAS",
        createPersona: "CREATE PERSONA",
        personaName: "PERSONA NAME",
        newPersona: "+ NEW",
        back: "BACK ->",
        create: "CREATE",
        creating: "CREATING...",
        activate: "ACTIVATE",
        view: "VIEW ->",
        delete: "DEL",
        active: "ACTIVE",
        cardsPlayedMeta: "{{count}} cards played",
        created: "Created",
        cannotDelete: "Cannot Delete",
        activateAnotherFirst: "Activate another persona first before deleting this one.",
        deletePersona: "Delete Persona",
        deletePrompt: "Delete {{name}}? All trajectory snapshots will be lost.",
        deleteAction: "Delete",
        cancel: "Cancel",
        couldNotLoad: "Could not load personas.",
        couldNotCreate: "Could not create persona.",
        couldNotActivate: "Could not activate persona.",
        couldNotDelete: "Could not delete.",
        defaultNewPersona: "New Persona"
      },
      decks: {
        title: "INVESTMENT DECKS",
        totalCards: "TOTAL CARDS",
        strategies: "STRATEGIES",
        decks: "DECKS",
        active: "ACTIVE",
        info: "Strategies are the top-level investment categories. Each strategy contains one or more specialized decks that filter which cards appear in your sessions. Enable or disable individual decks to focus your learning. Unlock new strategies and decks by playing more cards.",
        marketData: "MARKET DATA",
        cardDecks: "CARD DECKS",
        strategyActive: "● STRATEGY ACTIVE",
        strategyDisabled: "○ STRATEGY DISABLED",
        locked: "LOCKED",
        unlockAtCards: "{{count}} cards",
        unlocksAt: "Unlocks at {{count}} cards",
        required: "Required",
        atLeastOneStrategy: "At least one strategy must remain enabled.",
        atLeastOneDeck: "At least one deck must remain enabled.",
        couldNotLoad: "Could not load deck settings.",
        couldNotUpdateStrategy: "Could not update strategy settings.",
        couldNotUpdateDeck: "Could not update deck settings.",
        back: "BACK ->",
        strategyDescriptions: {
          savings: "Cash, money market funds, and savings accounts. Low risk, low return.",
          bonds: "Government and corporate debt instruments. Fixed income with predictable cash flows.",
          stocks: "Equity ownership in public companies. Higher volatility, higher expected return.",
          index: "Diversified market exposure via index funds and ETFs. Passive investing at its core.",
          alternatives: "Commodities, derivatives, real estate, and crypto. Advanced instruments."
        }
      },
      personaDetail: {
        title: "PERSONA ANALYSIS",
        activePersona: "ACTIVE PERSONA",
        persona: "PERSONA",
        rename: "RENAME",
        save: "SAVE",
        cancel: "CANCEL",
        cardsPlayed: "CARDS PLAYED",
        snapshots: "SNAPSHOTS",
        created: "CREATED",
        activatePersona: "ACTIVATE THIS PERSONA",
        interpretation: "BEHAVIORAL INTERPRETATION",
        trajectory: "PERSONA TRAJECTORY (PCA)",
        trajectoryDesc: "Each dot represents a snapshot of your persona vector taken every 10 cards, projected to 2D via principal component analysis.",
        traitBreakdown: "TRAIT BREAKDOWN",
        back: "BACK ->",
        couldNotLoad: "Could not load persona.",
        couldNotRename: "Could not rename persona.",
        couldNotActivate: "Could not activate persona.",
        traits: {
          risk_appetite: "Risk Appetite",
          fomo_sensitivity: "FOMO Sensitivity",
          loss_aversion: "Loss Aversion",
          patience: "Patience",
          diversification_bias: "Diversification Bias",
          overconfidence: "Overconfidence"
        },
        traitDescriptions: {
          risk_appetite: "Willingness to accept volatility for higher returns",
          fomo_sensitivity: "Tendency to act on fear of missing market moves",
          loss_aversion: "Emotional weight placed on losses vs. equivalent gains",
          patience: "Time horizon; preference for long-term vs. short-term",
          diversification_bias: "Tendency to spread vs. concentrate positions",
          overconfidence: "Tendency to over-weight personal analysis vs. market signals"
        }
      },
      gameSessions: {
        title: "SESSION HISTORY",
        sessions: "SESSIONS",
        back: "BACK ->",
        noSessions: "No sessions yet. Launch your first session to get started.",
        review: "REVIEW",
        continue: "CONTINUE ->",
        capital: "CAPITAL",
        return: "RETURN",
        stage: "STAGE",
        rank: "RANK",
        peak: "PEAK",
        lastPlayed: "Last played"
      },
      gameSessionDetail: {
        title: "SESSION REVIEW",
        continueSession: "CONTINUE SESSION ->",
        back: "BACK ->",
        finalCapital: "FINAL CAPITAL",
        decisions: "DECISIONS",
        accepted: "ACCEPTED",
        declined: "DECLINED",
        stage: "STAGE",
        decisionLog: "DECISION LOG",
        decisionsTapExpand: "{{count}} DECISIONS · TAP EACH TO EXPAND",
        noDecisions: "No decisions recorded yet.",
        acceptedTag: "ACCEPTED",
        declinedTag: "DECLINED",
        decline: "DECLINE",
        accept: "ACCEPT",
        yourChoice: "YOUR CHOICE",
        lesson: "LESSON",
        tapToExpand: "TAP TO EXPAND",
        tapToCollapse: "TAP TO COLLAPSE",
        difficulty: "Difficulty",
        unknownCard: "Unknown Card",
        general: "general"
      },
      play: {
        decisionEngine: "DECISION ENGINE",
        dailyComplete: "Daily Complete",
        dailyCompleteMsg: "Great run. Streak +1 and +${{amount}} capital bonus.",
        backToIndex: "Back to Index",
        initializingSession: "INITIALIZING SESSION",
        dailySessionComplete: "DAILY SESSION COMPLETE",
        loadingNextDecision: "LOADING NEXT DECISION...",
        decline: "DECLINE",
        accept: "ACCEPT",
        portfolio: "PORTFOLIO"
      },
      hud: {
        capital: "CAPITAL",
        stage: "STAGE",
        rank: "RANK",
        progress: "PROGRESS",
        level: "LVL",
        marketData: "MARKET DATA",
        macro: "MACRO",
        session: "SESSION",
        sentiment: "SENTIMENT",
        progressLabel: "PROGRESS",
        peak: "PEAK",
        pnl: "P&L",
        tenYearYield: "10Y YIELD",
        fedRate: "FED RATE",
        cpiYoy: "CPI YoY",
        sentimentBullish: "BULLISH",
        sentimentBearish: "BEARISH",
        sentimentNeutral: "NEUTRAL",
        rankNames: {
          none: "—",
          analyst: "ANALYST",
          associate: "ASSOCIATE",
          director: "DIRECTOR",
          md: "MD"
        }
      },
      lessonOverlay: {
        accepted: "ACCEPTED",
        declined: "DECLINED",
        return: "RETURN",
        tapToContinue: "TAP TO CONTINUE"
      },
      marketContext: {
        0: "BULL MARKET - EQUITIES TRENDING UP",
        1: "RATE SENSITIVE - FED WATCH ACTIVE",
        2: "VOLATILITY ELEVATED - VIX > 25",
        3: "RISK-OFF - FLIGHT TO SAFETY",
        4: "BEAR MARKET - CAPITAL PRESERVATION"
      }
    }
  },
  gsw: {
    translation: {
      profile: {
        profile: "PROFIL", accountSettings: "KONTO IISTELLIGE", activePersona: "AKTIVI PERSONA", recentSessions: "LETZTI SESSIONS", progress: "FORTSCHRITT", strategiesDecks: "STRATEGIE & DECKS", fullSettings: "VOLLI IISTELLIGE ->", manage: "VERWALTE ->", viewAll: "ALLI AAZEIGE ->", cardsPlayed: "GSPILTI CHARTE", cardsPlayedN: "{{count}} Charte gspilt", noPersonas: "No kei Persona. E Standard-Persona wird bi dr erschte Session erstellt.", noSessions: "No kei Sessions.", stage: "Stufe", username: "USERNAME", emailAddress: "EMAIL ADRESS", password: "PASSWORT", change: "AENDERE", save: "SPEICHERE", edit: "BEARBEITE", updatePassword: "PASSWORT AKTUALISIERE", saving: "AM SPEICHERE...", cancel: "ABBRECHE", current: "AKTUELL", new: "NEU", confirmNew: "NEU Bestaetige", changePassword: "PASSWORT AENDERE", tooShort: "Z churz", mismatch: "Nid gliich", passwordMinError: "Passwort muess mind. 8 Zeiche ha.", passwordMismatchError: "Passwoerter stimmed nöd ueberei.", success: "Erfolg", passwordUpdated: "Passwort aktualisiert.", error: "Fehler", updateFailed: "Update fehlgschlage.", atLeastOneDeck: "Mind. eis Deck mues aktiv bliibe.", atLeastOneStrategy: "Mind. eini Strategie mues aktiv bliibe.", couldNotUpdateDeck: "Deck konnt nöd aktualisiert werde.", couldNotUpdateStrategy: "Strategie konnt nöd aktualisiert werde.", logout: "ABMELDE", back: "ZRUG ->", tier: "TIER", role: "ROLLE", memberSince: "MITGLIED SIT", status: "STATUS", verified: "VERIFIZIERT", deckHint: "Strategie und Decks chasch aktiviere oder deaktiviere. Gsperrti Sache werde bi meh Charte freigschaltet.", viewTrajectory: "TRAJEKTORIE AALUEGE ->", unlocksAt: "Freischaltig bi {{count}} Charte", locked: "GSPERRT", required: "Noetig"
      },
      personas: {
        title: "PERSONAS", createPersona: "PERSONA ERSTELLE", personaName: "PERSONA NAME", newPersona: "+ NEU", back: "ZRUG ->", create: "ERSTELLE", creating: "AM ERSTELLE...", activate: "AKTIVIERE", view: "AALUEGE ->", delete: "LOESCHE", active: "AKTIV", cardsPlayedMeta: "{{count}} Charte gspilt", created: "Erstellt", cannotDelete: "Cha nöd loesche", activateAnotherFirst: "Aktivier zerscht e anderi Persona.", deletePersona: "Persona loesche", deletePrompt: "{{name}} loesche? Alli Snapshots gaend verlore.", deleteAction: "Loesche", cancel: "Abbreche", couldNotLoad: "Personas konnted nöd glade werde.", couldNotCreate: "Persona konnt nöd erstellt werde.", couldNotActivate: "Persona konnt nöd aktiviert werde.", couldNotDelete: "Loesche nöd moeglich.", defaultNewPersona: "Neui Persona"
      },
      decks: {
        title: "INVESTMENT DECKS", totalCards: "TOTAL CHARTE", strategies: "STRATEGIE", decks: "DECKS", active: "AKTIV", info: "Strategie sind d Oberkategorie. Jede Strategie het eis oder meh spezialisierte Decks, wo dini Charte in dr Session filtere.", marketData: "MARKET DATA", cardDecks: "CHARTE DECKS", strategyActive: "● STRATEGIE AKTIV", strategyDisabled: "○ STRATEGIE DEAKTIV", locked: "GSPERRT", unlockAtCards: "{{count}} Charte", unlocksAt: "Freischaltig bi {{count}} Charte", required: "Noetig", atLeastOneStrategy: "Mind. eini Strategie mues aktiv bliibe.", atLeastOneDeck: "Mind. eis Deck mues aktiv bliibe.", couldNotLoad: "Deck-Iistellige nöd glade.", couldNotUpdateStrategy: "Strategie-Iistellige nöd aktualisiert.", couldNotUpdateDeck: "Deck-Iistellige nöd aktualisiert.", back: "ZRUG ->", strategyDescriptions: { savings: "Cash, Geldmarktfonds und Sparkonti. Tiefrisiko, tiefe Ertrag.", bonds: "Staats- und Unternehmensobligationen. Fixi Ertraeg mit planbarem Cashflow.", stocks: "Aktiebeteiligige a boersenkotierte Firma. Hoecheri Volatilitaet, hoecheri Ertragserwartig.", index: "Breiti Marktabdeckig ueber Indexfonds und ETFs. Passivs Investiere im Kern.", alternatives: "Rohstoff, Derivate, Immobilie und Krypto. Fortgschritti Instrument." }
      },
      personaDetail: {
        title: "PERSONA ANALYSE", activePersona: "AKTIVI PERSONA", persona: "PERSONA", rename: "UMBENENNE", save: "SPEICHERE", cancel: "ABBRECHE", cardsPlayed: "GSPILTI CHARTE", snapshots: "SNAPSHOTS", created: "ERSTELLT", activatePersona: "DIE PERSONA AKTIVIERE", interpretation: "VERHALTE-INTERPRETATION", trajectory: "PERSONA TRAJEKTORIE (PCA)", trajectoryDesc: "Jede Punkt isch en Snapshot vo dim Persona-Vektor, alli 10 Charte in 2D projiziert.", traitBreakdown: "TRAIT UFSCHLUESSLIG", back: "ZRUG ->", couldNotLoad: "Persona konnt nöd glade werde.", couldNotRename: "Persona konnt nöd umbennannt werde.", couldNotActivate: "Persona konnt nöd aktiviert werde.", traits: { risk_appetite: "Risiko", fomo_sensitivity: "FOMO", loss_aversion: "Verlustangst", patience: "Geduld", diversification_bias: "Diversifikation", overconfidence: "Uebervertroue" }, traitDescriptions: { risk_appetite: "Bereitschaft, Volatilitaet fuer hoehere Ertraeg z akzeptiere", fomo_sensitivity: "Tendenz, us Angst vor verpasste Bewegige z handle", loss_aversion: "Emotionali Gwichtig vo Verluscht im Verglich zu Gwinne", patience: "Zithorizont; Liebi fuer langfrischtig statt kurzfrischtig", diversification_bias: "Tendenz, Positione z verteile statt z konzentriere", overconfidence: "Tendenz, eigeti Analyse ueber Marktsignal z stelle" }
      },
      gameSessions: { title: "SESSION VERLAUF", sessions: "SESSIONS", back: "ZRUG ->", noSessions: "No kei Sessions. Starte dini erscht Session.", review: "REVIEW", continue: "WITER ->", capital: "KAPITAL", return: "RENDITE", stage: "STUFE", rank: "RANG", peak: "HOECHST", lastPlayed: "Letschtmal gspilt" },
      gameSessionDetail: { title: "SESSION REVIEW", continueSession: "SESSION WITER ->", back: "ZRUG ->", finalCapital: "ENDKAPITAL", decisions: "ENTSCHID", accepted: "AKZEPTIERT", declined: "ABGLEHNT", stage: "STUFE", decisionLog: "ENTSCHID LOG", decisionsTapExpand: "{{count}} ENTSCHID · TIPPE ZUM OEFFNE", noDecisions: "No kei Entscheed.", acceptedTag: "AKZEPTIERT", declinedTag: "ABGLEHNT", decline: "ABLEHNE", accept: "AKZEPTIERE", yourChoice: "DINI WAHL", lesson: "LEKTION", tapToExpand: "TIPPE ZUM OEFFNE", tapToCollapse: "TIPPE ZUM SCHLIESSE", difficulty: "Schwierigkeit", unknownCard: "Unbekannti Charte", general: "allgemein" },
      play: { decisionEngine: "DECISION ENGINE", dailyComplete: "Daily fertig", dailyCompleteMsg: "Starki Run. Streak +1 und +${{amount}} Kapital-Bonus.", backToIndex: "Zrugg zum Index", initializingSession: "SESSION WIRD INITIIERT", dailySessionComplete: "DAILY SESSION FERTIG", loadingNextDecision: "NAECHSTE ENTSCHEID LADT...", decline: "ABLEHNE", accept: "AKZEPTIERE", portfolio: "PORTFOLIO" },
      hud: { capital: "KAPITAL", stage: "STUFE", rank: "RANG", progress: "FORTSCHRITT", level: "LVL", marketData: "MARKT DATE", macro: "MAKRO", session: "SESSION", sentiment: "STIMMIG", progressLabel: "FORTSCHRITT", peak: "HOECHST", pnl: "P&L", tenYearYield: "10J RENDITE", fedRate: "FED ZINS", cpiYoy: "CPI YoY", sentimentBullish: "BULLISH", sentimentBearish: "BEARISH", sentimentNeutral: "NEUTRAL", rankNames: { none: "—", analyst: "ANALYST", associate: "ASSOCIATE", director: "DIRECTOR", md: "MD" } },
      lessonOverlay: { accepted: "AKZEPTIERT", declined: "ABGLEHNT", return: "RENDITE", tapToContinue: "TIPPE ZUM WITER" },
      marketContext: {
        0: "BULL MARKET - AKTIE STIGE",
        1: "ZINS-SENSITIV - FED IM FOKUS",
        2: "HOCHI VOLATILITAET - VIX > 25",
        3: "RISK-OFF - FLUCHT IN SICHERHEIT",
        4: "BEAR MARKET - KAPITAL SCHUETZE"
      }
    }
  },
  fr: {
    translation: {
      profile: { profile: "PROFIL", accountSettings: "PARAMETRES COMPTE", activePersona: "PERSONA ACTIVE", recentSessions: "SESSIONS RECENTES", progress: "PROGRESSION", strategiesDecks: "STRATEGIES & DECKS", fullSettings: "PARAMETRES COMPLETS ->", manage: "GERER ->", viewAll: "VOIR TOUT ->", cardsPlayed: "CARTES JOUEES", cardsPlayedN: "{{count}} cartes jouees", noPersonas: "Aucune persona pour le moment.", noSessions: "Aucune session.", stage: "Niveau", username: "USERNAME", emailAddress: "ADRESSE EMAIL", password: "MOT DE PASSE", change: "CHANGER", save: "ENREGISTRER", edit: "EDITER", updatePassword: "METTRE A JOUR", saving: "ENREGISTREMENT...", cancel: "ANNULER", current: "ACTUEL", new: "NOUVEAU", confirmNew: "CONFIRMER", changePassword: "CHANGER LE MOT DE PASSE", tooShort: "Trop court", mismatch: "Different", passwordMinError: "Le mot de passe doit contenir au moins 8 caracteres.", passwordMismatchError: "Les mots de passe ne correspondent pas.", success: "Succes", passwordUpdated: "Mot de passe mis a jour.", error: "Erreur", updateFailed: "Echec de mise a jour.", atLeastOneDeck: "Au moins un deck doit rester actif.", atLeastOneStrategy: "Au moins une strategie doit rester active.", couldNotUpdateDeck: "Impossible de mettre a jour le deck.", couldNotUpdateStrategy: "Impossible de mettre a jour la strategie.", logout: "DECONNEXION", back: "RETOUR ->", tier: "NIVEAU", role: "ROLE", memberSince: "MEMBRE DEPUIS", status: "STATUT", verified: "VERIFIE", deckHint: "Activez ou desactivez strategies et decks. Les elements verrouilles se debloquent en jouant.", viewTrajectory: "VOIR TRAJECTOIRE ->", unlocksAt: "Debloque a {{count}} cartes", locked: "VERROUILLE", required: "Obligatoire" },
      personas: { title: "PERSONAS", createPersona: "CREER PERSONA", personaName: "NOM PERSONA", newPersona: "+ NOUVEAU", back: "RETOUR ->", create: "CREER", creating: "CREATION...", activate: "ACTIVER", view: "VOIR ->", delete: "SUPP", active: "ACTIVE", cardsPlayedMeta: "{{count}} cartes jouees", created: "Cree", cannotDelete: "Suppression impossible", activateAnotherFirst: "Activez une autre persona d'abord.", deletePersona: "Supprimer persona", deletePrompt: "Supprimer {{name}} ?", deleteAction: "Supprimer", cancel: "Annuler", couldNotLoad: "Impossible de charger les personas.", couldNotCreate: "Impossible de creer la persona.", couldNotActivate: "Impossible d'activer la persona.", couldNotDelete: "Suppression impossible.", defaultNewPersona: "Nouvelle Persona" },
      decks: { title: "DECKS D'INVESTISSEMENT", totalCards: "TOTAL CARTES", strategies: "STRATEGIES", decks: "DECKS", active: "ACTIF", info: "Les strategies sont les categories principales. Chaque strategie contient des decks specialises.", marketData: "DONNEES MARCHE", cardDecks: "DECKS DE CARTES", strategyActive: "● STRATEGIE ACTIVE", strategyDisabled: "○ STRATEGIE DESACTIVEE", locked: "VERROUILLE", unlockAtCards: "{{count}} cartes", unlocksAt: "Debloque a {{count}} cartes", required: "Obligatoire", atLeastOneStrategy: "Au moins une strategie doit rester active.", atLeastOneDeck: "Au moins un deck doit rester actif.", couldNotLoad: "Impossible de charger les parametres.", couldNotUpdateStrategy: "Impossible de mettre a jour la strategie.", couldNotUpdateDeck: "Impossible de mettre a jour le deck.", back: "RETOUR ->", strategyDescriptions: { savings: "Liquidites, fonds monetaire et comptes epargne. Risque faible, rendement faible.", bonds: "Obligations d'Etat et d'entreprise. Revenus fixes avec flux previsible.", stocks: "Participation en actions de societes cotees. Volatilite plus elevee, rendement attendu plus eleve.", index: "Exposition diversifiee via fonds indiciels et ETF. Investissement passif.", alternatives: "Matieres premieres, derives, immobilier et crypto. Instruments avances." } },
      personaDetail: { title: "ANALYSE PERSONA", activePersona: "PERSONA ACTIVE", persona: "PERSONA", rename: "RENOMMER", save: "ENREGISTRER", cancel: "ANNULER", cardsPlayed: "CARTES JOUEES", snapshots: "SNAPSHOTS", created: "CREE", activatePersona: "ACTIVER CETTE PERSONA", interpretation: "INTERPRETATION COMPORTEMENTALE", trajectory: "TRAJECTOIRE PERSONA (PCA)", trajectoryDesc: "Chaque point represente un snapshot du vecteur persona tous les 10 cartes.", traitBreakdown: "DETAIL DES TRAITS", back: "RETOUR ->", couldNotLoad: "Impossible de charger la persona.", couldNotRename: "Impossible de renommer.", couldNotActivate: "Impossible d'activer.", traits: { risk_appetite: "Appetit au risque", fomo_sensitivity: "Sensibilite FOMO", loss_aversion: "Aversion aux pertes", patience: "Patience", diversification_bias: "Biais de diversification", overconfidence: "Surconfiance" }, traitDescriptions: { risk_appetite: "Volonte d'accepter la volatilite pour un meilleur rendement", fomo_sensitivity: "Tendance a agir par peur de rater un mouvement de marche", loss_aversion: "Poids emotionnel des pertes par rapport a des gains equivalents", patience: "Horizon temporel; preference long terme vs court terme", diversification_bias: "Tendance a diversifier plutot qu'a concentrer", overconfidence: "Tendance a surpondérer son analyse face aux signaux du marche" } },
      gameSessions: { title: "HISTORIQUE DES SESSIONS", sessions: "SESSIONS", back: "RETOUR ->", noSessions: "Aucune session. Lancez votre premiere session.", review: "REVUE", continue: "CONTINUER ->", capital: "CAPITAL", return: "RENDEMENT", stage: "NIVEAU", rank: "RANG", peak: "PIC", lastPlayed: "Derniere activite" },
      gameSessionDetail: { title: "REVUE SESSION", continueSession: "CONTINUER ->", back: "RETOUR ->", finalCapital: "CAPITAL FINAL", decisions: "DECISIONS", accepted: "ACCEPTE", declined: "REFUSE", stage: "NIVEAU", decisionLog: "JOURNAL DES DECISIONS", decisionsTapExpand: "{{count}} DECISIONS · TOUCHEZ POUR OUVRIR", noDecisions: "Aucune decision.", acceptedTag: "ACCEPTE", declinedTag: "REFUSE", decline: "REFUSER", accept: "ACCEPTER", yourChoice: "VOTRE CHOIX", lesson: "LECON", tapToExpand: "TOUCHER POUR OUVRIR", tapToCollapse: "TOUCHER POUR FERMER", difficulty: "Difficulte", unknownCard: "Carte inconnue", general: "general" },
      play: { decisionEngine: "MOTEUR DE DECISION", dailyComplete: "Quotidien termine", dailyCompleteMsg: "Excellent run. Serie +1 et bonus +${{amount}}.", backToIndex: "Retour index", initializingSession: "INITIALISATION SESSION", dailySessionComplete: "SESSION QUOTIDIENNE TERMINEE", loadingNextDecision: "CHARGEMENT DECISION...", decline: "REFUSER", accept: "ACCEPTER", portfolio: "PORTEFEUILLE" },
      hud: { capital: "CAPITAL", stage: "NIVEAU", rank: "RANG", progress: "PROGRESSION", level: "NIV", marketData: "DONNEES MARCHE", macro: "MACRO", session: "SESSION", sentiment: "SENTIMENT", progressLabel: "PROGRESSION", peak: "PIC", pnl: "P&L", tenYearYield: "RENDEMENT 10A", fedRate: "TAUX FED", cpiYoy: "IPC YoY", sentimentBullish: "HAUSSIER", sentimentBearish: "BAISSIER", sentimentNeutral: "NEUTRE", rankNames: { none: "—", analyst: "ANALYSTE", associate: "ASSOCIE", director: "DIRECTEUR", md: "MD" } },
      lessonOverlay: { accepted: "ACCEPTE", declined: "REFUSE", return: "RENDEMENT", tapToContinue: "TOUCHEZ POUR CONTINUER" },
      marketContext: {
        0: "MARCHE HAUSSIER - ACTIONS EN HAUSSE",
        1: "SENSIBLE AUX TAUX - FED SOUS SURVEILLANCE",
        2: "VOLATILITE ELEVEE - VIX > 25",
        3: "RISK-OFF - RECHERCHE DE SECURITE",
        4: "MARCHE BAISSIER - PRESERVATION DU CAPITAL"
      }
    }
  },
  it: {
    translation: {
      profile: { profile: "PROFILO", accountSettings: "IMPOSTAZIONI ACCOUNT", activePersona: "PERSONA ATTIVA", recentSessions: "SESSIONI RECENTI", progress: "PROGRESSO", strategiesDecks: "STRATEGIE & DECK", fullSettings: "IMPOSTAZIONI COMPLETE ->", manage: "GESTISCI ->", viewAll: "VEDI TUTTO ->", cardsPlayed: "CARTE GIOCATE", cardsPlayedN: "{{count}} carte giocate", noPersonas: "Nessuna persona per ora.", noSessions: "Nessuna sessione.", stage: "Livello", username: "USERNAME", emailAddress: "INDIRIZZO EMAIL", password: "PASSWORD", change: "CAMBIA", save: "SALVA", edit: "MODIFICA", updatePassword: "AGGIORNA PASSWORD", saving: "SALVATAGGIO...", cancel: "ANNULLA", current: "ATTUALE", new: "NUOVA", confirmNew: "CONFERMA", changePassword: "CAMBIA PASSWORD", tooShort: "Troppo corta", mismatch: "Non coincide", passwordMinError: "La password deve avere almeno 8 caratteri.", passwordMismatchError: "Le password non coincidono.", success: "Successo", passwordUpdated: "Password aggiornata.", error: "Errore", updateFailed: "Aggiornamento fallito.", atLeastOneDeck: "Almeno un deck deve restare attivo.", atLeastOneStrategy: "Almeno una strategia deve restare attiva.", couldNotUpdateDeck: "Impossibile aggiornare il deck.", couldNotUpdateStrategy: "Impossibile aggiornare la strategia.", logout: "LOGOUT", back: "INDIETRO ->", tier: "LIVELLO", role: "RUOLO", memberSince: "MEMBRO DAL", status: "STATO", verified: "VERIFICATO", deckHint: "Abilita/disabilita strategie e deck. Gli elementi bloccati si sbloccano giocando.", viewTrajectory: "VEDI TRAIETTORIA ->", unlocksAt: "Sblocco a {{count}} carte", locked: "BLOCCATO", required: "Richiesto" },
      personas: { title: "PERSONAS", createPersona: "CREA PERSONA", personaName: "NOME PERSONA", newPersona: "+ NUOVA", back: "INDIETRO ->", create: "CREA", creating: "CREAZIONE...", activate: "ATTIVA", view: "VEDI ->", delete: "ELIM", active: "ATTIVA", cardsPlayedMeta: "{{count}} carte giocate", created: "Creata", cannotDelete: "Impossibile eliminare", activateAnotherFirst: "Attiva prima un'altra persona.", deletePersona: "Elimina persona", deletePrompt: "Eliminare {{name}}?", deleteAction: "Elimina", cancel: "Annulla", couldNotLoad: "Impossibile caricare personas.", couldNotCreate: "Impossibile creare persona.", couldNotActivate: "Impossibile attivare persona.", couldNotDelete: "Impossibile eliminare.", defaultNewPersona: "Nuova Persona" },
      decks: { title: "DECK DI INVESTIMENTO", totalCards: "TOTALE CARTE", strategies: "STRATEGIE", decks: "DECK", active: "ATTIVO", info: "Le strategie sono le categorie principali. Ogni strategia contiene deck specializzati.", marketData: "DATI MERCATO", cardDecks: "DECK CARTE", strategyActive: "● STRATEGIA ATTIVA", strategyDisabled: "○ STRATEGIA DISATTIVA", locked: "BLOCCATO", unlockAtCards: "{{count}} carte", unlocksAt: "Sblocco a {{count}} carte", required: "Richiesto", atLeastOneStrategy: "Almeno una strategia deve restare attiva.", atLeastOneDeck: "Almeno un deck deve restare attivo.", couldNotLoad: "Impossibile caricare impostazioni deck.", couldNotUpdateStrategy: "Impossibile aggiornare strategia.", couldNotUpdateDeck: "Impossibile aggiornare deck.", back: "INDIETRO ->", strategyDescriptions: { savings: "Liquidita, fondi monetari e conti di risparmio. Rischio basso, rendimento basso.", bonds: "Obbligazioni governative e societarie. Reddito fisso con flussi prevedibili.", stocks: "Partecipazioni azionarie in societa quotate. Volatilita piu alta, rendimento atteso piu alto.", index: "Esposizione diversificata tramite fondi indicizzati ed ETF. Investimento passivo.", alternatives: "Materie prime, derivati, immobiliare e crypto. Strumenti avanzati." } },
      personaDetail: { title: "ANALISI PERSONA", activePersona: "PERSONA ATTIVA", persona: "PERSONA", rename: "RINOMINA", save: "SALVA", cancel: "ANNULLA", cardsPlayed: "CARTE GIOCATE", snapshots: "SNAPSHOT", created: "CREATA", activatePersona: "ATTIVA QUESTA PERSONA", interpretation: "INTERPRETAZIONE COMPORTAMENTALE", trajectory: "TRAIETTORIA PERSONA (PCA)", trajectoryDesc: "Ogni punto rappresenta uno snapshot del vettore persona ogni 10 carte.", traitBreakdown: "DETTAGLIO TRATTI", back: "INDIETRO ->", couldNotLoad: "Impossibile caricare persona.", couldNotRename: "Impossibile rinominare.", couldNotActivate: "Impossibile attivare.", traits: { risk_appetite: "Propensione al rischio", fomo_sensitivity: "Sensibilita FOMO", loss_aversion: "Avversione alle perdite", patience: "Pazienza", diversification_bias: "Bias diversificazione", overconfidence: "Eccesso di fiducia" }, traitDescriptions: { risk_appetite: "Disponibilita ad accettare volatilita per rendimenti piu alti", fomo_sensitivity: "Tendenza ad agire per paura di perdere movimenti di mercato", loss_aversion: "Peso emotivo delle perdite rispetto a guadagni equivalenti", patience: "Orizzonte temporale; preferenza per lungo termine vs breve termine", diversification_bias: "Tendenza a distribuire invece di concentrare le posizioni", overconfidence: "Tendenza a sovrastimare la propria analisi rispetto ai segnali di mercato" } },
      gameSessions: { title: "CRONOLOGIA SESSIONI", sessions: "SESSIONI", back: "INDIETRO ->", noSessions: "Nessuna sessione. Avvia la prima sessione.", review: "RIVEDI", continue: "CONTINUA ->", capital: "CAPITALE", return: "RENDIMENTO", stage: "LIVELLO", rank: "RANK", peak: "PICCO", lastPlayed: "Ultima attivita" },
      gameSessionDetail: { title: "REVISIONE SESSIONE", continueSession: "CONTINUA SESSIONE ->", back: "INDIETRO ->", finalCapital: "CAPITALE FINALE", decisions: "DECISIONI", accepted: "ACCETTATE", declined: "RIFIUTATE", stage: "LIVELLO", decisionLog: "LOG DECISIONI", decisionsTapExpand: "{{count}} DECISIONI · TOCCA PER APRIRE", noDecisions: "Nessuna decisione.", acceptedTag: "ACCETTATA", declinedTag: "RIFIUTATA", decline: "RIFIUTA", accept: "ACCETTA", yourChoice: "TUA SCELTA", lesson: "LEZIONE", tapToExpand: "TOCCA PER ESPANDERE", tapToCollapse: "TOCCA PER CHIUDERE", difficulty: "Difficolta", unknownCard: "Carta sconosciuta", general: "generale" },
      play: { decisionEngine: "MOTORE DECISIONALE", dailyComplete: "Daily completata", dailyCompleteMsg: "Ottimo run. Streak +1 e bonus +${{amount}}.", backToIndex: "Torna all'indice", initializingSession: "INIZIALIZZAZIONE SESSIONE", dailySessionComplete: "SESSIONE DAILY COMPLETA", loadingNextDecision: "CARICAMENTO DECISIONE...", decline: "RIFIUTA", accept: "ACCETTA", portfolio: "PORTAFOGLIO" },
      hud: { capital: "CAPITALE", stage: "LIVELLO", rank: "RANK", progress: "PROGRESSO", level: "LVL", marketData: "DATI MERCATO", macro: "MACRO", session: "SESSIONE", sentiment: "SENTIMENT", progressLabel: "PROGRESSO", peak: "PICCO", pnl: "P&L", tenYearYield: "RENDIMENTO 10A", fedRate: "TASSO FED", cpiYoy: "CPI YoY", sentimentBullish: "RIALZISTA", sentimentBearish: "RIBASSISTA", sentimentNeutral: "NEUTRALE", rankNames: { none: "—", analyst: "ANALISTA", associate: "ASSOCIATE", director: "DIRETTORE", md: "MD" } },
      lessonOverlay: { accepted: "ACCETTATA", declined: "RIFIUTATA", return: "RENDIMENTO", tapToContinue: "TOCCA PER CONTINUARE" },
      marketContext: {
        0: "MERCATO BULL - AZIONI IN CRESCITA",
        1: "SENSIBILE AI TASSI - FED SOTTO OSSERVAZIONE",
        2: "VOLATILITA ALTA - VIX > 25",
        3: "RISK-OFF - RICERCA DI SICUREZZA",
        4: "MERCATO BEAR - PRESERVAZIONE DEL CAPITALE"
      }
    }
  }
} as const;
