import React, { useContext, useRef, useEffect } from 'react';
import { NotepadoContext } from '../context/NotepadoContext';
import { useTranslation } from 'react-i18next';
import {Link, Navigate, useNavigate} from "react-router-dom";

interface HeaderProps {
    mainMenuVisible: boolean;
    setMainMenuVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header: React.FC<HeaderProps> = ({ mainMenuVisible, setMainMenuVisible }) => {
    const { t, i18n } = useTranslation();
    const {
        loadNotepadSave,
        loadNotepadSaveLanguage,
        setVisibleDescriptions,
        setIsDescriptionVisible,
        setShowSearch,
        showSearch,
        setSearchTerm,
        searchTerm,
        handleSearchChange,
        isDescriptionVisible,
        activePage,
        dirAttribute,
        setDirAttribute,
        rtlLangs
    } = useContext(NotepadoContext);
    const navigate = useNavigate();

    // Referencja do pola wyszukiwania
    const inputRef = useRef<HTMLInputElement>(null);
    const closeMenuRef = useRef(null);
    const closeMenuBtnRef = useRef(null);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const getLanguageCode = (lng) => lng.split('-')[0];

    useEffect(() => {
        const lang = getLanguageCode(i18n.language);
        const htmlTag = document.querySelector("html");
        htmlTag.setAttribute("lang",lang);
        // const rtlLangs = ["ug", "syr", "ks", "ar", "fa", "he", "ur", "ckb", "arc", "sd", "ps"];
        if (rtlLangs.includes(lang)) {
            htmlTag.setAttribute("dir", "rtl");
            setDirAttribute('rtl');
        } else {
            htmlTag.setAttribute("dir", "ltr");
            setDirAttribute('ltr');
        }
    }, [i18n.language]);

    useEffect(() => {
        const handleClick = (event) => {
            const checkAllOutise = closeMenuRef.current && !closeMenuRef.current.contains(event.target);
            const checkBtnMenu = closeMenuBtnRef.current && !closeMenuBtnRef.current.contains(event.target);
            if (checkAllOutise && checkBtnMenu) {
                setMainMenuVisible(false);
            }
        };
        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, []);

    // Ustawiamy fokus na polu wyszukiwania po zmianie showSearch na true
    useEffect(() => {
        if (showSearch && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showSearch]);

    const showMainMenu = () => {
        setMainMenuVisible(prevState => !prevState);
    };

    const homePage = (e) => {
        e.preventDefault();
        navigate("/");
        setVisibleDescriptions(null);
        setIsDescriptionVisible(false);
    };

    return (
        <header className="o-main-header">

            <h1><a href="/" onClick={homePage}  data-discover="true"><i className="icon-notepado"></i><strong>Notepado</strong></a></h1>
            <nav className="o-main-header__nav">
                <ul>
                    {(!isDescriptionVisible && (
                        <li className={showSearch ? 'o-search-active' : ''}>
                            {showSearch && (
                                <input
                                    ref={inputRef}
                                    type="search"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            )}
                            <button
                                onClick={() => {
                                    setShowSearch((prevState) => !prevState);
                                    if (showSearch) {
                                        setSearchTerm('');
                                    }
                                }}
                            >
                                <i className={showSearch ? 'icon-cancel' : 'icon-search'}/>
                            </button>
                        </li>
                    ))}

                    <li>
                        <button ref={closeMenuBtnRef} onClick={showMainMenu}
                                className={`o-main-header__btn-menu ${mainMenuVisible ? 'o-main-header__btn-menu--active' : ''}`}
                                aria-label="Open and close menu"><span>Menu</span></button>
                    </li>
                </ul>
                <div ref={closeMenuRef}
                     className={`o-main-header__menu ${mainMenuVisible ? 'o-main-header__menu--active' : ''}`}
                     tabIndex={-1}
                     dir={dirAttribute}
                >
                    <div dir="ltr" className="o-main-header__menu-langs">
                        <label htmlFor="o-lang"><i className="icon-language"></i> Lnag:</label>
                        <select id="o-lang" onChange={(e) => changeLanguage(e.target.value)}
                                value={getLanguageCode(i18n.language)}>
                            <option value="az">Azərbaycan (Azerbaijani)</option>
                            <option value="cs">Česky (Czech)</option>
                            <option value="da">Dansk (Danish)</option>
                            <option value="de">Deutsch (German)</option>
                            <option value="et">Eesti (Estonian)</option>
                            <option value="en">English (English)</option>
                            <option value="el">Ελληνικά (Greek)</option>
                            <option value="es">Español (Spanish)</option>
                            <option value="yo">Èdè Yorùbá (Yoruba)</option>
                            <option value="fr">Français (French)</option>
                            <option value="ha">Hausa (Hausa)</option>
                            <option value="hr">Hrvatski (Croatian)</option>
                            <option value="ig">Igbo (Igbo)</option>
                            <option value="id">Indonesia (Indonesian)</option>
                            <option value="xh">isiXhosa (Xhosa)</option>
                            <option value="zu">isiZulu (Zulu)</option>
                            <option value="it">Italiano (Italian)</option>
                            <option value="kl">Kalaallisut (Greenlandic)</option>
                            <option value="ht">Kreyòl Ayisyen (Haitian Creole)</option>
                            <option value="crs">Kreol Seselwa (Seychellois Creole)</option>
                            <option value="sw">Kiswahili (Swahili)</option>
                            <option value="lv">Latviešu (Latvian)</option>
                            <option value="lt">Lietuvių (Lithuanian)</option>
                            <option value="ln">Lingála (Lingala)</option>
                            <option value="hu">Magyar (Hungarian)</option>
                            <option value="mi">Māori (Māori)</option>
                            <option value="ms">Melayu (Malay)</option>
                            <option value="nl">Nederlands (Dutch)</option>
                            <option value="no">Norsk (Norwegian)</option>
                            <option value="uz">O‘zbek (Uzbek)</option>
                            <option value="pl">Polski (Polish)</option>
                            <option value="pt">Português (Portuguese)</option>
                            <option value="ro">Română (Romanian)</option>
                            <option value="sq">Shqip (Albanian)</option>
                            <option value="sk">Slovenčina (Slovak)</option>
                            <option value="sl">Slovenščina (Slovenian)</option>
                            <option value="so">Soomaali (Somali)</option>
                            <option value="sr">Srpski (Serbian)</option>
                            <option value="fi">Suomi (Finnish)</option>
                            <option value="sv">Svenska (Swedish)</option>
                            <option value="tl">Tagalog (Tagalog)</option>
                            <option value="tpi">Tok Pisin (Tok Pisin)</option>
                            <option value="tk">Türkmen (Turkmen)</option>
                            <option value="tr">Türkçe (Turkish)</option>
                            <option value="haw">ʻŌlelo HawaiʻI (Hawaiian)</option>
                            <option value="wo">Wolof (Wolof)</option>
                            <option value="ru">Русский (Russian)</option>
                            <option value="bg">Български (Bulgarian)</option>
                            <option value="uk">Українська (Ukrainian)</option>
                            <option value="kk">Қазақ (Kazakh)</option>
                            <option value="ky">Кыргызча (Kyrgyz)</option>
                            <option value="be">Беларуская (Belarusian)</option>
                            <option value="mn">Монгол (Mongolian)</option>
                            <option value="tg">Тоҷикӣ (Tajik)</option>
                            <option value="hy">Հայերեն (Armenian)</option>
                            <option value="zh">中文 (Chinese)</option>
                            <option value="ja">日本語 (Japanese)</option>
                            <option value="ko">한국어 (Korean)</option>
                            <option value="th">ไทย (Thai)</option>
                            <option value="km">ព្រាសាខ្មែរ (Khmer)</option>
                            <option value="lo">ລາວ (Lao)</option>
                            <option value="ne">नेपाली (Nepali)</option>
                            <option value="ka">ქართული (Georgian)</option>
                            <option value="hi">हिन्दी (Hindi)</option>
                            <option value="am">አማርኛ (Amharic)</option>
                            <option dir="rtl" value="ug">ئۇيغۇرچە (Uyghur)</option>
                            <option dir="rtl" value="syr">ܣܘܪܝܐܝ (Syriac)</option>
                            <option dir="rtl" value="ks">کٲشُر (Kashmiri)</option>
                            <option dir="rtl" value="ar">عَرَبِيّ (Arabic)</option>
                            <option dir="rtl" value="fa">فارسی (Persian)</option>
                            <option dir="rtl" value="he">עברית (Hebrew)</option>
                            <option dir="rtl" value="ur">اردو (Urdu)</option>
                            <option dir="rtl" value="ckb">کوردی (Kurdish)</option>
                            <option dir="rtl" value="arc">ܡܘܪܐܨ (Aramaic)</option>
                            <option dir="rtl" value="sd">سنڌي (Sindhi)</option>
                            <option dir="rtl" value="ps">پښتو (Pashto)</option>
                        </select>
                    </div>
                    {/*<nav dir={dirAttribute}>*/}
                    {/*    <ul>*/}
                    {/*        <li><Link onClick={() => {*/}
                    {/*            showMainMenu();*/}
                    {/*        }} to="/settings"><i*/}
                    {/*            className="icon-wrench"></i> {t('settings')}</Link></li>*/}

                    {/*        <li><Link onClick={() => {*/}
                    {/*            showMainMenu();*/}
                    {/*        }} to="/create"><i*/}
                    {/*            className="icon-plus"></i> {t('add_notepad')}</Link></li>*/}
                    {/*    </ul>*/}
                    {/*</nav>*/}
                    <div dir="ltr">
                        <p>Notepado v1.0.02 {window.cordova ? 'App' : 'Browser'} / <span
                            className="uppercase">{i18n.language}</span></p>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;
