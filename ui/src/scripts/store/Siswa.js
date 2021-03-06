/**
 * Smartscore
 * Sistem Pendukung Keputusan Pemilihan Siswa Terbaik
 *
 * @copyright   Copyright (c) 2017, Adnan Zaki
 * @license     Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International Public License | https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode
 * @author      Adnan Zaki
 * @link        https://wolestech.com
 * @version     1.0.0
 */

import Vue from 'vue'
import Vuex from 'vuex'
import { SSPaging as paging } from '../modules/SSPaging'
import { shared } from '../modules/Shared'

Vue.use(Vuex)

export const Siswa = new Vuex.Store({
    modules: {
        paging,
        shared
    },
    state: {        
        daftarSiswa: '', detailSiswa: '', filename: '',
        loadingText: '', cariSiswa: '', idSiswa: '',
        showDaftarSiswa: false, showFormAdd: false,
        showFormEdit: false, selectedID: [],
        deleteConfirm: false, importDialog: false,
        importProgress: false, jmlBaris: 10, localLimit: 10,
        allSelected: false, rombel: [],
        token: '', 
        lockStatus: '', // status pengecekan data perbandingan alternatif

        // alert
        insertAlert: false, updateAlert: false, deleteAlert: false, insertAndClose: false,
        errorInsert: false, errorUpdate: false, unableToDelete: false,

        // error messages
        error: {
            nama: '', nis: '', nisn: '', jKelaminSiswa: '', tmptLahir: '', tglLahir: '',
            alamatSiswa: '', namaAyah: '', namaIbu: '', rombel: '',
        },
    },
    mutations: { 
        selectAll(state) {
            $.ajax({
                url: `${state.shared.apiUrl}admin/SiswaController/getAllSiswaID/${state.token}`,
                type: 'get',
                dataType: 'json',
                success: data => {
                    state.selectedID = []
                    if (state.allSelected) {
                        state.selectedID = data
                    }
                }
            })
        },             
        getFilename(state) {
            var file = $("#file").val()
            file = file.split("\\")
            state.filename = file[file.length - 1]
        },
        closeImportDialog(state) {
            state.filename = ''
            state.importDialog = false
        },        
        showDeleteConfirm(state, id) {
            state.selectedID = []
            state.unableToDelete = false
            state.selectedID.push(id)
            state.deleteConfirm = true
        },
        closeDeleteConfirm(state) {
            state.selectedID = []
            state.deleteConfirm = false
        },        
        isChecked(state) {
            if(state.detailSiswa.j_kelamin_siswa === $("#j_laki").val()) {
                $("#j_laki").prop("checked", true)
            } else {
                $("#j_perempuan").prop("checked", true)
            }
        },
        isSelected(state, target) {
            var obj = state
            $(`#${target} option`).each(function() {
                if(obj.detailSiswa[target] === $(this).val()) {
                    $(this).attr("selected", "selected")
                }
            })
        },        
        showForm(state, form) {
            state.showDaftarSiswa = false
            setTimeout(() => {
                state[form] = true
                setTimeout(() => {
                    $("#datetimepicker1").datetimepicker({
                        format: 'DD/MM/YYYY',
                        icons: {
                          time: 'fa fa-clock-o',
                          date: 'fa fa-calendar',
                          up: 'fa fa-chevron-up',
                          down: 'fa fa-chevron-down',
                          previous: 'fa fa-chevron-left',
                          next: 'fa fa-chevron-right',
                          today: 'fa fa-screenshot',
                          clear: 'fa fa-trash',
                          close: 'fa fa-remove'
                        }
                    })
                }, 100)

                // ambil daftar rombel
                $.ajax({
                    url: `${state.shared.apiUrl}admin/SiswaController/getRombel/${state.token}`,
                    type: 'GET',
                    crossDomain: true,
                    dataType: 'json',
                    success: data => {
                        state.rombel = data
                    }
                })
            }, 400)            
        },
        showAlert(state, alert) {
            state[alert] = true
            setTimeout(() => {
                state[alert] = false
            }, 4000)
        },
        clearMessages(state) {
            state.error.nama = ''
            state.error.nis = ''
            state.error.nisn = ''
            state.error.tmptLahir = ''
            state.error.tglLahir = ''
            state.error.alamatSiswa = ''
            state.error.namaAyah = ''
            state.error.namaIbu = ''
            state.error.rombel = ''
        },
        hadCompared: state => {
            $.ajax({
                url: `${state.shared.apiUrl}admin/SiswaController/hadCompared`,
                type: 'GET',
                crossDomain: true,
                success: msg => {
                    state.lockStatus = msg
                }
            })
            return (state.lockStatus === '1') ? true : false
        },
    },
    actions: {
        /**
         * getSiswa(state: string, payload: {limit, start, search})
         * 
         * @param {object} state 
         * @param {object} payload 
         * 
         */
        getSiswa({ state, commit, dispatch }, payload) {
            commit('getCookie', 'ss_session')
            state.token = state.shared.cookieName
            if (state.token === '') {
                window.location.href = `${state.shared.apiUrl}AuthController/logout/`
            } else {
                state.showFormAdd = false
                state.showFormEdit = false
                var obj = state
                state.paging.limit = payload.limit
                state.paging.offset = payload.offset * payload.limit
                let param = `${payload.limit}/${state.paging.offset}/${state.token}/${payload.search}`
                $.ajax({
                    url: `${state.shared.apiUrl}admin/SiswaController/fetchSiswa/${param}`,
                    type: 'GET',
                    crossDomain: true,
                    dataType: 'json',
                    success: data => {
                        obj.daftarSiswa = data['dataSiswa']
                        setTimeout(() => {
                            obj.showDaftarSiswa = true
                        }, 400)

                        dispatch('create', {
                            rows: data['totalRows'],
                            start: payload.offset,
                            linkNum: 4,
                            activeClass: 'az-active',
                            linkClass: 'waves-effect'
                        })
                    },
                })
            }
        },  
        /**
         * insertSiswa(state: object, payload: {event, id})
         * 
         * @param {object} state 
         * @param {*} payload 
         */
        insertSiswa({ state, commit, dispatch }, payload) {
            let form
            if (payload.event === 'insert') {
                form = $("#formTambahSiswa")
            } else {
                form = $("#formEditSiswa")
            }
            var param = `${payload.event}/${payload.id}/${state.token}`
            var obj = state,
                dataForm = form.serialize()
            $.ajax({
                url: `${state.shared.apiUrl}admin/SiswaController/setSiswa/${param}`,
                type: 'POST',
                dataType: 'json',
                data: dataForm,
                success: msg => {
                    if (msg.msg !== 'success') {
                        if (payload.event === 'insert') {
                            obj.insertAlert = false
                            obj.errorInsert = true
                            commit('showAlert', 'errorInsert')
                        } else {
                            obj.updateAlert = false
                            commit('showAlert', 'errorUpdate')
                        }
                        obj.error.nama = msg.nama_siswa
                        obj.error.nis = msg.nis
                        obj.error.nisn = msg.nisn
                        obj.error.jKelaminSiswa = msg.j_kelamin_siswa
                        obj.error.tmptLahir = msg.tempat_lahir_siswa
                        obj.error.tglLahir = msg.tgl_lahir_siswa
                        obj.error.alamatSiswa = msg.alamat_siswa
                        obj.error.namaAyah = msg.nama_ayah
                        obj.error.namaIbu = msg.nama_ibu
                        obj.error.rombel = msg.id_rombel
                    } else {
                        commit('clearMessages')

                        // jika event nya adalah insert data siswa
                        // maka bersihkan form, lalu tampilkan alert dan ambil id_siswa
                        if (payload.event === 'insert') {
                            form.trigger("reset")
                            obj.errorInsert = false
                            if(payload.closeForm) {
                                dispatch('closeForm', 'showFormAdd')
                                commit('showAlert', 'insertAndClose')
                            } else {
                                //commit('showAlert', 'insert')
                                obj.insertAlert = true
                                obj.idSiswa = msg['id'][0].id_siswa                       
                            }

                            // selain itu, jika event nya adalah update data siswa,
                            // maka tampilkan kembali form edit siswa dan tampilkan alert
                        } else {
                            obj.errorUpdate = false
                            if (payload.closeForm) {
                                dispatch('closeForm', 'showFormEdit')
                            } else {
                                dispatch('editSiswa', payload.id)
                            }                            
                            commit('showAlert', 'updateAlert')
                        }
                    }
                }
            })
        },
        editSiswa({ state, commit }, id) {
            if (state.showFormAdd) {
                state.showFormAdd = false
            }
            state.insertAlert = false
            $.ajax({
                url: `${state.shared.apiUrl}admin/SiswaController/editSiswa/${id}/${state.token}`,
                type: 'GET',
                crossDomain: true,
                dataType: 'json',
                success: data => {
                    state.detailSiswa = data
                    commit('showForm', 'showFormEdit')

                    // berikan timeout 500 mili detik untuk menjalankan fungsi
                    // radio button mana yg harus dicek
                    // karena timeout untuk membuka form adalah 400 mili detik
                    setTimeout(() => {
                        commit('isChecked')
                        commit('isSelected', 'agama_siswa')
                        commit('isSelected', 'job_ayah')
                        commit('isSelected', 'job_ibu')
                        commit('isSelected', 'job_wali')
                    }, 500)
                }
            })
        },
        /**
         * importSiswa(state: object)
         * 
         * @param {object} state 
         */
        importSiswa({ state, commit, dispatch }) {
            var form = document.forms.namedItem('imporSiswa'),
                data = new FormData(form),
                req = new XMLHttpRequest()
            req.open("POST", `${state.shared.apiUrl}admin/SiswaController/importSiswa/${state.token}`, true)
            state.importDialog = false
            state.filename = ''
            state.loadingText = "Mengimpor data..."
            state.importProgress = true
            req.responseType = 'json'
            req.onload = objEvent => {
                if (req.response === 0) {
                    state.loadingText = "Format file yang anda masukkan tidak sesuai"
                } else {
                    state.loadingText = `${req.response.success}, ${req.response.failed}`
                    dispatch('runGetSiswa')
                }
            }
            req.send(data)
        },
        deleteSiswa({ state, commit, dispatch }) {
            var idString = state.selectedID.join("-")
            $.ajax({
                url: `${state.shared.apiUrl}admin/SiswaController/deleteSiswa/${idString}/${state.token}`,
                type: 'POST',
                dataType: 'json',
                success: () => {
                    state.deleteConfirm = false
                    state.selectedID = []

                    // lakukan pengecekan total baris dalam satu halaman tabel siswa
                    // jika data hanya satu baris, maka offset akan diatur ke halaman sebelumnya
                    // contoh: jika total data pada hal. 3 hanya 1 baris, maka offset akan diatur ke hal. 2
                    let diff = state.paging.totalRows - state.paging.offset
                    if (diff === 1 && state.paging.offset > 0) {
                        state.paging.offset -= state.paging.limit
                    }

                    dispatch('runGetSiswa')
                    commit('showAlert', 'deleteAlert')                    

                    if(state.allSelected) {
                        state.allSelected = false
                    }
                }
            })
        },
        showPerPage({ state, commit, dispatch }) {
            state.localLimit = parseInt(state.jmlBaris)
            dispatch('getSiswa', {
                limit: state.localLimit,
                offset: 0,
                search: state.cariSiswa
            })
        },  
        runGetSiswa({ state, dispatch }) {
            let start = state.paging.offset / state.localLimit
            dispatch('getSiswa', {
                limit: state.localLimit,
                offset: start,
                search: state.cariSiswa
            })
        },   
        closeForm({ state, commit, dispatch }, form) {
            state[form] = false
            commit('clearMessages')
            state.insertAlert = false
            state.updateAlert = false
            state.errorInsert = false
            state.errorUpdate = false
            setTimeout(() => {
                dispatch('runGetSiswa')
                state.showDaftarSiswa = true
            }, 400)
        },
        multipleDeleteSiswa({state, commit}) {
            if (state.selectedID.length < 1) {
                commit('showAlert', 'unableToDelete')
            } else {
                state.unableToDelete = false                
                state.deleteConfirm = true
            }
        },
    },
})
